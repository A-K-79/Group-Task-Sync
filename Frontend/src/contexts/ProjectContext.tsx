import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';

export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdBy: string;
  completedBy?: string;
  createdAt: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PersonalTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

export interface AssignedProjectTask {
  projectId: string;
  projectName: string;
  task: Task;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  adminId: string;
  members: string[];
  memberDetails: { id: string; name: string; email: string }[];
  tasks: Task[];
}

interface ProjectContextType {
  projects: Project[];
  notifications: Notification[];
  personalTasks: PersonalTask[];
  assignedProjectTasks: AssignedProjectTask[];
  createProject: (name: string, description: string) => Promise<void>;
  editProject: (projectId: string, name: string, description: string) => Promise<boolean>;
  addMemberToProject: (projectId: string, memberEmail: string) => Promise<boolean>;
  createTask: (
    projectId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => Promise<void>;
  editTask: (
    projectId: string,
    taskId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => Promise<boolean>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  completeTask: (projectId: string, taskId: string) => Promise<void>;
  completeAssignedTask: (projectId: string, taskId: string) => Promise<boolean>;
  createPersonalTask: (title: string, description?: string) => Promise<void>;
  editPersonalTask: (taskId: string, title: string, description: string) => Promise<boolean>;
  togglePersonalTask: (taskId: string) => Promise<void>;
  deletePersonalTask: (taskId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  hasUnreadNotifications: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);

  const fetchData = useCallback(async () => {
    if (!token || !user) {
      setProjects([]);
      setNotifications([]);
      setPersonalTasks([]);
      return;
    }

    try {
      const [projectsData, notificationsData, personalTasksData] = await Promise.all([
        apiRequest<Project[]>('/projects', { token }),
        apiRequest<Notification[]>('/notifications', { token }),
        apiRequest<PersonalTask[]>('/personal-tasks', { token }),
      ]);
      setProjects(projectsData);
      setNotifications(notificationsData);
      setPersonalTasks(personalTasksData);
    } catch (error) {
      toast({
        title: 'Sync error',
        description: error instanceof Error ? error.message : 'Failed to load data',
        variant: 'destructive',
      });
    }
  }, [token, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createProject = async (name: string, description: string) => {
    if (!token) return;
    try {
      const created = await apiRequest<Project>('/projects', {
        method: 'POST',
        token,
        body: { name, description },
      });
      setProjects(prev => [...prev, created]);
      toast({
        title: 'Project created',
        description: `Project "${name}" has been created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const editProject = async (projectId: string, name: string, description: string) => {
    if (!token) return false;
    try {
      const updated = await apiRequest<Project>(`/projects/${projectId}`, {
        method: 'PATCH',
        token,
        body: { name, description },
      });
      setProjects(prev => prev.map(project => (project.id === projectId ? updated : project)));
      toast({
        title: 'Project updated',
        description: `Project "${name}" has been updated successfully`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Permission denied',
        description: error instanceof Error ? error.message : 'Failed to update project',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addMemberToProject = async (projectId: string, memberEmail: string) => {
    if (!token) return false;
    try {
      const updated = await apiRequest<Project>(`/projects/${projectId}/add-member`, {
        method: 'POST',
        token,
        body: { email: memberEmail },
      });
      setProjects(prev => prev.map(project => (project.id === projectId ? updated : project)));
      const addedMember = updated.memberDetails.find(member => member.email === memberEmail);
      toast({
        title: 'Member added',
        description: `${addedMember?.name || memberEmail} has been added to the project`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Add member failed',
        description: error instanceof Error ? error.message : 'Could not add member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createTask = async (
    projectId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!token) return;
    try {
      const newTask = await apiRequest<Task>(`/projects/${projectId}/tasks`, {
        method: 'POST',
        token,
        body: {
          title,
          description,
          assignedTo: assignedTo === 'unassigned' ? null : assignedTo,
          dueDate: dueDate || null,
          priority,
        },
      });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, tasks: [...project.tasks, newTask] } : project
        )
      );
      toast({
        title: 'Task created',
        description: `Task "${title}" has been created successfully`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Create task failed',
        description: error instanceof Error ? error.message : 'Could not create task',
        variant: 'destructive',
      });
    }
  };

  const editTask = async (
    projectId: string,
    taskId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!token) return false;
    try {
      const updated = await apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        token,
        body: {
          title,
          description,
          assignedTo: assignedTo === 'unassigned' ? null : assignedTo || null,
          dueDate: dueDate || null,
          priority,
        },
      });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId
            ? {
                ...project,
                tasks: project.tasks.map(task => (task.id === taskId ? updated : task)),
              }
            : project
        )
      );
      toast({
        title: 'Task updated',
        description: `Task "${title}" has been updated successfully`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Permission denied',
        description: error instanceof Error ? error.message : 'Could not edit task',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    if (!token) return;
    try {
      const project = projects.find(p => p.id === projectId);
      const task = project?.tasks.find(t => t.id === taskId);
      await apiRequest(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        token,
      });
      setProjects(prev =>
        prev.map(projectItem =>
          projectItem.id === projectId
            ? { ...projectItem, tasks: projectItem.tasks.filter(taskItem => taskItem.id !== taskId) }
            : projectItem
        )
      );
      toast({
        title: 'Task deleted',
        description: task ? `Task "${task.title}" has been deleted` : 'Task deleted',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Delete task failed',
        description: error instanceof Error ? error.message : 'Could not delete task',
        variant: 'destructive',
      });
    }
  };

  const completeTask = async (projectId: string, taskId: string) => {
    if (!token) return;
    try {
      const updated = await apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}/complete`, {
        method: 'POST',
        token,
      });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId
            ? {
                ...project,
                tasks: project.tasks.map(task => (task.id === taskId ? updated : task)),
              }
            : project
        )
      );
      toast({
        title: 'Task completed',
        description: `Task "${updated.title}" has been marked as completed`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Complete task failed',
        description: error instanceof Error ? error.message : 'Could not complete task',
        variant: 'destructive',
      });
    }
  };

  const completeAssignedTask = async (projectId: string, taskId: string) => {
    if (!user) return false;
    const task = projects
      .find(project => project.id === projectId)
      ?.tasks.find(taskItem => taskItem.id === taskId);
    if (!task || task.assignedTo !== user.id) {
      return false;
    }
    await completeTask(projectId, taskId);
    return true;
  };

  const createPersonalTask = async (title: string, description = '') => {
    if (!token) return;
    try {
      const created = await apiRequest<PersonalTask>('/personal-tasks', {
        method: 'POST',
        token,
        body: { title, description },
      });
      setPersonalTasks(prev => [...prev, created]);
      toast({
        title: 'Personal task created',
        description: `Task "${title}" was added to your personal list`,
      });
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Could not create personal task',
        variant: 'destructive',
      });
    }
  };

  const editPersonalTask = async (taskId: string, title: string, description: string) => {
    if (!token) return false;
    try {
      const updated = await apiRequest<PersonalTask>(`/personal-tasks/${taskId}`, {
        method: 'PATCH',
        token,
        body: { title, description },
      });
      setPersonalTasks(prev => prev.map(task => (task.id === taskId ? updated : task)));
      toast({
        title: 'Personal task updated',
        description: `Task "${title}" was updated`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update personal task',
        variant: 'destructive',
      });
      return false;
    }
  };

  const togglePersonalTask = async (taskId: string) => {
    if (!token) return;
    const task = personalTasks.find(taskItem => taskItem.id === taskId);
    if (!task) return;
    try {
      const updated = await apiRequest<PersonalTask>(`/personal-tasks/${taskId}`, {
        method: 'PATCH',
        token,
        body: { completed: !task.completed },
      });
      setPersonalTasks(prev => prev.map(taskItem => (taskItem.id === taskId ? updated : taskItem)));
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update personal task',
        variant: 'destructive',
      });
    }
  };

  const deletePersonalTask = async (taskId: string) => {
    if (!token) return;
    const task = personalTasks.find(taskItem => taskItem.id === taskId);
    try {
      await apiRequest(`/personal-tasks/${taskId}`, {
        method: 'DELETE',
        token,
      });
      setPersonalTasks(prev => prev.filter(taskItem => taskItem.id !== taskId));
      toast({
        title: 'Personal task deleted',
        description: task ? `Task "${task.title}" was removed from your personal list` : 'Task removed',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete personal task',
        variant: 'destructive',
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await apiRequest(`/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        token,
      });
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch {
      // no-op
    }
  };

  const clearReadNotifications = async () => {
    if (!token) return;
    try {
      await apiRequest('/notifications/clear-read', {
        method: 'POST',
        token,
      });
      setNotifications(prev => prev.filter(notification => !notification.read));
      toast({
        title: 'Notifications cleared',
        description: 'All read notifications have been cleared',
      });
    } catch (error) {
      toast({
        title: 'Clear failed',
        description: error instanceof Error ? error.message : 'Could not clear notifications',
        variant: 'destructive',
      });
    }
  };

  const hasUnreadNotifications = notifications.some(notification => !notification.read);
  const assignedProjectTasks = useMemo(
    () =>
      user
        ? projects.flatMap(project =>
            project.tasks
              .filter(task => task.assignedTo === user.id)
              .map(task => ({
                projectId: project.id,
                projectName: project.name,
                task,
              }))
          )
        : [],
    [projects, user]
  );

  const value = {
    projects,
    notifications,
    personalTasks,
    assignedProjectTasks,
    createProject,
    editProject,
    addMemberToProject,
    createTask,
    editTask,
    deleteTask,
    completeTask,
    completeAssignedTask,
    createPersonalTask,
    editPersonalTask,
    togglePersonalTask,
    deletePersonalTask,
    markNotificationAsRead,
    clearReadNotifications,
    hasUnreadNotifications,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
