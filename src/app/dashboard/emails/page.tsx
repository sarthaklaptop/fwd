import EmailsSection from './emails-section';

export default function EmailsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Emails</h1>
                <p className="text-muted-foreground">View and track all sent emails</p>
            </div>

            {/* Content */}
            <EmailsSection />
        </div>
    );
}
