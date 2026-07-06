import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createInvestor } from '../../api/investors';
import { InvestorForm, InvestorFormValues } from '../../components/investors/InvestorForm';

export function InvestorNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSubmit(values: InvestorFormValues) {
    const investor = await createInvestor(values);
    await queryClient.invalidateQueries({ queryKey: ['investors'] });
    navigate(`/investors/${investor.id}`);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink">Add investor</h1>
        <p className="text-sm text-slate mt-1">
          Creates a new investor record in the DRAFT stage of the onboarding workflow.
        </p>
      </header>

      <InvestorForm
        submitLabel="Create investor"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/investors')}
      />
    </div>
  );
}
