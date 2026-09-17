
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import Navbar from '@/components/Navbar';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userProjects, setUserProjects] = useState(projects);

  // Filter projects for the current user
  useEffect(() => {
    if (user) {
      const filteredProjects = projects.filter(project => 
        project.members.includes(user.id)
      );
      setUserProjects(filteredProjects);
    }
  }, [projects, user]);

  if (!user) {
    return null; // This should be handled by the ProtectedRoute
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>
        
        {userProjects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <h3 className="text-xl font-medium mb-3">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started!</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
      
      <footer className="py-6 bg-white border-t text-center text-gray-500 text-sm">
        TaskSync &copy; {new Date().getFullYear()} - All rights reserved.
      </footer>
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
