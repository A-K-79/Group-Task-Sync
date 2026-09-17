from django.contrib.auth.models import User
from django.db.models import Prefetch
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Notification, PersonalTask, Project, ProjectMembership, Task
from .serializers import (
    LoginSerializer,
    NotificationSerializer,
    PersonalTaskSerializer,
    ProjectSerializer,
    SignupSerializer,
    TaskSerializer,
)


def _user_payload(user):
    return {
        'id': str(user.id),
        'name': user.first_name,
        'email': user.email,
    }


def _project_queryset_for_user(user):
    return Project.objects.filter(members=user).prefetch_related(
        'members',
        Prefetch('tasks', queryset=Task.objects.select_related('assigned_to', 'created_by', 'completed_by')),
    )


def _as_optional_user(value):
    if value in (None, '', 'unassigned'):
        return None
    return User.objects.filter(id=value).first()


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': _user_payload(user)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    raw_password = serializer.validated_data['password']
    user = User.objects.filter(email=email).first()
    if not user or not user.check_password(raw_password):
        user = None
    if not user:
        return Response({'detail': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': _user_payload(user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({'user': _user_payload(request.user)})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def projects(request):
    if request.method == 'GET':
        serializer = ProjectSerializer(_project_queryset_for_user(request.user), many=True)
        return Response(serializer.data)

    project = Project.objects.create(
        name=request.data.get('name', ''),
        description=request.data.get('description', ''),
        admin=request.user,
    )
    ProjectMembership.objects.create(project=project, user=request.user)
    serializer = ProjectSerializer(project)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def project_update(request, project_id):
    project = Project.objects.filter(id=project_id, members=request.user).first()
    if not project:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    if project.admin_id != request.user.id:
        return Response({'detail': 'Only project admin can edit the project'}, status=status.HTTP_403_FORBIDDEN)

    project.name = request.data.get('name', project.name)
    project.description = request.data.get('description', project.description)
    project.save()
    return Response(ProjectSerializer(project).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_add_member(request, project_id):
    project = Project.objects.filter(id=project_id, members=request.user).first()
    if not project:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    if project.admin_id != request.user.id:
        return Response({'detail': 'Only project admin can add members'}, status=status.HTTP_403_FORBIDDEN)

    email = request.data.get('email')
    member = User.objects.filter(email=email).first()
    if not member:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    membership, created = ProjectMembership.objects.get_or_create(project=project, user=member)
    if not created:
        return Response({'detail': 'User already a member'}, status=status.HTTP_400_BAD_REQUEST)

    Notification.objects.create(user=member, message=f'You were added to project "{project.name}"')
    return Response(ProjectSerializer(project).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_create_task(request, project_id):
    project = Project.objects.filter(id=project_id, members=request.user).first()
    if not project:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    assigned_user = _as_optional_user(request.data.get('assignedTo'))
    if assigned_user and not project.members.filter(id=assigned_user.id).exists():
        return Response({'detail': 'Assignee must be a project member'}, status=status.HTTP_400_BAD_REQUEST)

    task = Task.objects.create(
        project=project,
        title=request.data.get('title', ''),
        description=request.data.get('description', ''),
        created_by=request.user,
        assigned_to=assigned_user,
        due_date=request.data.get('dueDate'),
        priority=request.data.get('priority', 'medium'),
    )

    for member in project.members.exclude(id=request.user.id):
        Notification.objects.create(
            user=member,
            message=f'New task "{task.title}" was added to project "{project.name}"',
        )

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def project_task_update_delete(request, project_id, task_id):
    project = Project.objects.filter(id=project_id, members=request.user).first()
    if not project:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    task = Task.objects.filter(id=task_id, project=project).first()
    if not task:
        return Response({'detail': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if project.admin_id != request.user.id:
        return Response({'detail': 'Only project admin can edit tasks'}, status=status.HTTP_403_FORBIDDEN)

    task.title = request.data.get('title', task.title)
    task.description = request.data.get('description', task.description)
    assigned_user = _as_optional_user(request.data.get('assignedTo'))
    if assigned_user and not project.members.filter(id=assigned_user.id).exists():
        return Response({'detail': 'Assignee must be a project member'}, status=status.HTTP_400_BAD_REQUEST)
    task.assigned_to = assigned_user
    task.due_date = request.data.get('dueDate')
    task.priority = request.data.get('priority', task.priority)
    task.save()
    return Response(TaskSerializer(task).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_task_complete(request, project_id, task_id):
    project = Project.objects.filter(id=project_id, members=request.user).first()
    if not project:
        return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    task = Task.objects.filter(id=task_id, project=project).first()
    if not task:
        return Response({'detail': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if task.completed:
        return Response(TaskSerializer(task).data)

    task.completed = True
    task.completed_by = request.user
    task.save()

    for member in project.members.exclude(id=request.user.id):
        Notification.objects.create(
            user=member,
            message=f'{request.user.first_name} completed task "{task.title}" in project "{project.name}"',
        )

    return Response(TaskSerializer(task).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def personal_tasks(request):
    if request.method == 'GET':
        serializer = PersonalTaskSerializer(PersonalTask.objects.filter(owner=request.user), many=True)
        return Response(serializer.data)

    task = PersonalTask.objects.create(
        owner=request.user,
        title=request.data.get('title', ''),
        description=request.data.get('description', ''),
    )
    return Response(PersonalTaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def personal_task_update_delete(request, task_id):
    task = PersonalTask.objects.filter(id=task_id, owner=request.user).first()
    if not task:
        return Response({'detail': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    task.title = request.data.get('title', task.title)
    task.description = request.data.get('description', task.description)
    if 'completed' in request.data:
        task.completed = bool(request.data.get('completed'))
    task.save()
    return Response(PersonalTaskSerializer(task).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    serializer = NotificationSerializer(
        Notification.objects.filter(user=request.user).order_by('-created_at'),
        many=True,
    )
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    notification = Notification.objects.filter(id=notification_id, user=request.user).first()
    if not notification:
        return Response({'detail': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    notification.read = True
    notification.save()
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_read_notifications(request):
    Notification.objects.filter(user=request.user, read=True).delete()
    return Response({'success': True})
