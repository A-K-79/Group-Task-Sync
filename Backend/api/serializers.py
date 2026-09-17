from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Notification, PersonalTask, Project, Task


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdBy = serializers.CharField(source='created_by_id', read_only=True)
    completedBy = serializers.CharField(source='completed_by_id', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    assignedTo = serializers.CharField(source='assigned_to_id', allow_null=True, required=False)
    assignedToName = serializers.CharField(source='assigned_to.first_name', read_only=True, allow_null=True)
    dueDate = serializers.DateTimeField(source='due_date', allow_null=True, required=False)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'completed',
            'createdBy',
            'completedBy',
            'createdAt',
            'assignedTo',
            'assignedToName',
            'dueDate',
            'priority',
        ]


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    adminId = serializers.CharField(source='admin_id', read_only=True)
    members = serializers.SerializerMethodField()
    memberDetails = serializers.SerializerMethodField()
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'createdAt',
            'adminId',
            'members',
            'memberDetails',
            'tasks',
        ]

    def get_members(self, obj):
        return [str(member.id) for member in obj.members.all()]

    def get_memberDetails(self, obj):
        return [
            {'id': str(member.id), 'name': member.first_name, 'email': member.email}
            for member in obj.members.all()
        ]


class PersonalTaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = PersonalTask
        fields = ['id', 'title', 'description', 'completed', 'createdAt']


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'message', 'createdAt', 'read']


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already in use')
        return value

    def create(self, validated_data):
        pwd_value = validated_data.get('password')
        user = User(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['name'],
        )
        user.set_password(pwd_value)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
