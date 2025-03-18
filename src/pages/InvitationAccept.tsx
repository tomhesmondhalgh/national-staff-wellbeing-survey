
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import AuthForm from '../components/auth/AuthForm';
import InvitationError from '../components/invitation/InvitationError';
import InvitationSuccess from '../components/invitation/InvitationSuccess';
import InvitationDetails from '../components/invitation/InvitationDetails';
import { useInvitation } from '../hooks/useInvitation';

const InvitationAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const {
    isLoading,
    invitation,
    error,
    showAuthForm,
    accountCreated,
    handleAcceptInvitation,
    handleAuthFormSubmit
  } = useInvitation(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <InvitationError errorMessage={error} />
      </MainLayout>
    );
  }

  if (accountCreated) {
    return (
      <MainLayout>
        <InvitationSuccess organizationName={invitation?.organizations?.school_name} />
      </MainLayout>
    );
  }

  if (showAuthForm) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Complete Your Invitation" 
            subtitle={`Sign in or create an account to join ${invitation?.organizations?.school_name}`}
          />
          <AuthForm 
            mode="login" 
            onSubmit={handleAuthFormSubmit} 
            isLoading={isLoading} 
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <InvitationDetails 
        organizationName={invitation?.organizations?.school_name}
        role={invitation?.role}
        onAccept={handleAcceptInvitation}
        isLoading={isLoading}
      />
    </MainLayout>
  );
};

export default InvitationAccept;
