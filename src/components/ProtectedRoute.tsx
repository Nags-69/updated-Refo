import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true);
    }
  }, [user, isLoading]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleModalClose = (open: boolean) => {
    setShowAuthModal(open);
    if (!open && !user) {
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal
          open={showAuthModal}
          onOpenChange={handleModalClose}
          onSuccess={handleAuthSuccess}
        />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </>
    );
  }

  return <>{children}</>;
};
