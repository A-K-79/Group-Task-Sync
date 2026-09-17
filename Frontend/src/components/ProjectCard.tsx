
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/contexts/ProjectContext';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  
  // Calculate completed tasks ratio
  const completedTasks = project.tasks.filter(task => task.completed).length;
  const totalTasks = project.tasks.length;
  
  // Calculate progress percentage
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 text-xs font-medium">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-primary rounded-full h-2.5" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <Users size={16} className="text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">{project.members.length} members</span>
          </div>
          <div className="text-sm text-gray-500">
            {completedTasks}/{totalTasks} tasks done
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
