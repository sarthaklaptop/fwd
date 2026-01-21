import BillingSection from './billing-section';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Billing
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <BillingSection />
    </div>
  );
}
