from django.urls import path

from . import views

urlpatterns = [
    path('auth/signup', views.signup),
    path('auth/login', views.login),
    path('auth/logout', views.logout),
    path('auth/me', views.me),
    path('projects', views.projects),
    path('projects/<int:project_id>', views.project_update),
    path('projects/<int:project_id>/add-member', views.project_add_member),
    path('projects/<int:project_id>/tasks', views.project_create_task),
    path('projects/<int:project_id>/tasks/<int:task_id>', views.project_task_update_delete),
    path('projects/<int:project_id>/tasks/<int:task_id>/complete', views.project_task_complete),
    path('personal-tasks', views.personal_tasks),
    path('personal-tasks/<int:task_id>', views.personal_task_update_delete),
    path('notifications', views.notifications),
    path('notifications/<int:notification_id>/mark-read', views.mark_notification_read),
    path('notifications/clear-read', views.clear_read_notifications),
]
