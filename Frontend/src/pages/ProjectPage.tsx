
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, Project, Task } from '@/contexts/ProjectContext';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import EditProjectModal from '@/components/EditProjectModal';
import AddMemberModal from '@/components/AddMemberModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Users, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Find the current project
  useEffect(() => {
    if (projectId) {
      const currentProject = projects.find(p => p.id === projectId);
      if (currentProject) {
        setProject(currentProject);
        setIsAdmin(user?.id === currentProject.adminId);
      } else {
        navigate('/dashboard');
      }
    }
  }, [projectId, projects, navigate, user]);

  // Get project members details
  useEffect(() => {
    if (project) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const members = project.members.map(memberId => {
        const user = users.find((u: any) => u.id === memberId);
        return user ? { id: user.id, name: user.name, email: user.email } : null;
      }).filter(Boolean);
      
      setProjectMembers(members);
    }
  }, [project]);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleEditProject = () => {
    setIsEditProjectModalOpen(true);
  };

  if (!user || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = project.tasks.filter(task => !task.completed);
  const completedTasks = project.tasks.filter(task => task.completed);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleEditProject}
                  >
                    <Edit size={16} />
                  </Button>
                )}
              </div>
              <p className="text-gray-600 mt-1">{project.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <div className="flex gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsMemberModalOpen(true)}
                >
                  <Users size={16} className="mr-2" />
                  Add Member
                </Button>
              )}
              
              <Button onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium">Team Members</h3>
            <Badge variant="outline">{projectMembers.length}</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {projectMembers.map(member => (
              <div 
                key={member.id}
                className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center"
              >
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs mr-2">
                  {member.name.substring(0, 1).toUpperCase()}
                </div>
                <span>
                  {member.name}
                  {member.id === project.adminId && (
                    <span className="text-xs ml-1 text-gray-500">(Admin)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pending Tasks ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed Tasks ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2">No pending tasks</h3>
                  <p className="text-gray-600 mb-4">All tasks have been completed, or you haven't added any tasks yet.</p>
                  <Button onClick={() => setIsTaskModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      projectId={project.id} 
                      onEdit={handleEditTask}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2">No completed tasks yet</h3>
                  <p className="text-gray-600">Tasks will appear here when they're marked as completed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      projectId={project.id}
                      isAdmin={isAdmin} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <footer className="py-6 bg-white border-t text-center text-gray-500 text-sm">
        TaskSync &copy; {new Date().getFullYear()} - All rights reserved.
      </footer>
      
      <CreateTaskModal 
        projectId={project.id}
        projectMembers={projectMembers}
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />

      <EditTaskModal 
        projectId={project.id}
        task={selectedTask}
        projectMembers={projectMembers}
        isOpen={isEditTaskModalOpen} 
        onClose={() => {
          setIsEditTaskModalOpen(false);
          setSelectedTask(null);
        }} 
      />

      <EditProjectModal 
        project={project}
        isOpen={isEditProjectModalOpen} 
        onClose={() => setIsEditProjectModalOpen(false)} 
      />
      
      <AddMemberModal 
        projectId={project.id}
        isOpen={isMemberModalOpen} 
        onClose={() => setIsMemberModalOpen(false)} 
      />
    </div>
  );
};

export default ProjectPage;
