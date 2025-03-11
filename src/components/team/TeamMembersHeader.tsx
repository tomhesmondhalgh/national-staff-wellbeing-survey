
import { UserPlus } from 'lucide-react';
import { Button } from '../ui/button';

type TeamMembersHeaderProps = {
  onInvite: () => void;
};

export default function TeamMembersHeader({ onInvite }: TeamMembersHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Team Members</h2>
      <Button
        onClick={onInvite}
        className="bg-brandPurple-500 hover:bg-brandPurple-600"
      >
        <UserPlus size={16} className="mr-2" />
        Invite Member
      </Button>
    </div>
  );
}
