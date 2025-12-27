import EmailsSection from './emails-section';

export default function EmailsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Emails</h1>
                <p className="text-muted-foreground">View and track all sent emails</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
                <EmailsSection />
            </div>
        </div>
    );
}
