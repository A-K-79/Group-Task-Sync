import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

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
  assignedTo?: string; // New: user ID the task is assigned to
  dueDate?: string;    // New: due date for the task
  priority: 'low' | 'medium' | 'high'; // New: task priority
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  adminId: string;
  members: string[];
  tasks: Task[];
}

interface ProjectContextType {
  projects: Project[];
  notifications: Notification[];
  createProject: (name: string, description: string) => void;
  editProject: (projectId: string, name: string, description: string) => boolean;
  addMemberToProject: (projectId: string, memberEmail: string) => void;
  createTask: (
    projectId: string, 
    title: string, 
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => void;
  editTask: (
    projectId: string,
    taskId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => boolean;
  deleteTask: (projectId: string, taskId: string) => void;
  completeTask: (projectId: string, taskId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearReadNotifications: () => void;
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
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Load projects from localStorage
    if (user) {
      const storedProjects = localStorage.getItem('projects');
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }

      const storedNotifications = localStorage.getItem(`notifications-${user.id}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    } else {
      setProjects([]);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    // Save projects to localStorage when they change
    if (user && projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects, user]);

  useEffect(() => {
    // Save notifications to localStorage when they change
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const createProject = (name: string, description: string) => {
    if (!user) return;

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      adminId: user.id,
      members: [user.id],
      tasks: [],
    };

    setProjects([...projects, newProject]);
    
    toast({
      title: 'Project created',
      description: `Project "${name}" has been created successfully`,
    });
  };

  const editProject = (projectId: string, name: string, description: string) => {
    if (!user) return false;

    const projectToEdit = projects.find(p => p.id === projectId);
    
    // Check if user is admin
    if (!projectToEdit || projectToEdit.adminId !== user.id) {
      toast({
        title: 'Permission denied',
        description: 'Only the project admin can edit project details',
        variant: 'destructive',
      });
      return false;
    }

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedProject = {
          ...project,
          name,
          description
        };
        
        toast({
          title: 'Project updated',
          description: `Project "${name}" has been updated successfully`,
        });
        
        return updatedProject;
      }
      return project;
    }));
    
    return true;
  };

  const addMemberToProject = (projectId: string, memberEmail: string) => {
    if (!user) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userToAdd = users.find((u: any) => u.email === memberEmail);
    
    if (!userToAdd) {
      toast({
        title: 'User not found',
        description: `No user found with email: ${memberEmail}`,
        variant: 'destructive',
      });
      return;
    }

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        // Check if user is already a member
        if (project.members.includes(userToAdd.id)) {
          toast({
            title: 'Member exists',
            description: `${userToAdd.name} is already a member of this project`,
            variant: 'destructive',
          });
          return project;
        }
        
        // Add user to project
        const updatedProject = {
          ...project,
          members: [...project.members, userToAdd.id]
        };
        
        // Create notification for the added user
        const newNotification: Notification = {
          id: `notification-${Date.now()}`,
          message: `You were added to project "${project.name}"`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        
        // Store notification for the added user
        const userNotifications = JSON.parse(localStorage.getItem(`notifications-${userToAdd.id}`) || '[]');
        localStorage.setItem(
          `notifications-${userToAdd.id}`, 
          JSON.stringify([...userNotifications, newNotification])
        );
        
        toast({
          title: 'Member added',
          description: `${userToAdd.name} has been added to the project`,
        });
        
        return updatedProject;
      }
      return project;
    }));
  };

  const createTask = (
    projectId: string, 
    title: string, 
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!user) return;

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title,
          description,
          completed: false,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          assignedTo,
          dueDate,
          priority,
        };
        
        const updatedProject = {
          ...project,
          tasks: [...project.tasks, newTask]
        };
        
        // Create notifications for all project members except the task creator
        project.members.forEach(memberId => {
          if (memberId !== user.id) {
            const newNotification: Notification = {
              id: `notification-${Date.now()}-${memberId}`,
              message: `New task "${title}" was added to project "${project.name}"`,
              createdAt: new Date().toISOString(),
              read: false,
            };
            
            // Store notification for each member
            const memberNotifications = JSON.parse(localStorage.getItem(`notifications-${memberId}`) || '[]');
            localStorage.setItem(
              `notifications-${memberId}`, 
              JSON.stringify([...memberNotifications, newNotification])
            );
          }
        });
        
        toast({
          title: 'Task created',
          description: `Task "${title}" has been created successfully`,
        });
        
        return updatedProject;
      }
      return project;
    }));
  };

  const editTask = (
    projectId: string,
    taskId: string,
    title: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!user) return false;

    const projectToEdit = projects.find(p => p.id === projectId);
    
    // Check if user is admin
    if (!projectToEdit || projectToEdit.adminId !== user.id) {
      toast({
        title: 'Permission denied',
        description: 'Only the project admin can edit tasks',
        variant: 'destructive',
      });
      return false;
    }

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              title,
              description,
              assignedTo,
              dueDate,
              priority
            };
          }
          return task;
        });
        
        toast({
          title: 'Task updated',
          description: `Task "${title}" has been updated successfully`,
        });
        
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));
    
    return true;
  };

  const deleteTask = (projectId: string, taskId: string) => {
    if (!user) return;

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const taskToDelete = project.tasks.find(t => t.id === taskId);
        if (!taskToDelete) return project;
        
        const updatedProject = {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        };
        
        toast({
          title: 'Task deleted',
          description: `Task "${taskToDelete.title}" has been deleted`,
        });
        
        return updatedProject;
      }
      return project;
    }));
  };

  const completeTask = (projectId: string, taskId: string) => {
    if (!user) return;

    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId && !task.completed) {
            // Create notifications for all project members
            project.members.forEach(memberId => {
              if (memberId !== user.id) {
                const newNotification: Notification = {
                  id: `notification-${Date.now()}-${memberId}`,
                  message: `${user.name} completed task "${task.title}" in project "${project.name}"`,
                  createdAt: new Date().toISOString(),
                  read: false,
                };
                
                // Store notification for each member
                const memberNotifications = JSON.parse(localStorage.getItem(`notifications-${memberId}`) || '[]');
                localStorage.setItem(
                  `notifications-${memberId}`, 
                  JSON.stringify([...memberNotifications, newNotification])
                );
              }
            });
            
            toast({
              title: 'Task completed',
              description: `Task "${task.title}" has been marked as completed`,
            });
            
            return { ...task, completed: true, completedBy: user.id };
          }
          return task;
        });
        
        return { ...project, tasks: updatedTasks };
      }
      return project;
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    if (!user) return;
    
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
  };

  const clearReadNotifications = () => {
    if (!user) return;
    
    const unreadNotifications = notifications.filter(notification => !notification.read);
    setNotifications(unreadNotifications);
    localStorage.setItem(`notifications-${user.id}`, JSON.stringify(unreadNotifications));
    
    toast({
      title: 'Notifications cleared',
      description: 'All read notifications have been cleared',
    });
  };

  const hasUnreadNotifications = notifications.some(notification => !notification.read);

  const value = {
    projects,
    notifications,
    createProject,
    editProject,
    addMemberToProject,
    createTask,
    editTask,
    deleteTask,
    completeTask,
    markNotificationAsRead,
    clearReadNotifications,
    hasUnreadNotifications,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
