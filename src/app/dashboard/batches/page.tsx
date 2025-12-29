import BatchesSection from './batches-section';

export default function BatchesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Batches</h1>
                <p className="text-muted-foreground">Send and track bulk email campaigns</p>
            </div>

            {/* Content */}
            <BatchesSection />
        </div>
    );
}
