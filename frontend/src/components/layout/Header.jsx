import { LogOut, Menu, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout.mutate();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.name || 'User'}</span>
          <span className="text-muted-foreground">({user?.role})</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logout.isPending}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
