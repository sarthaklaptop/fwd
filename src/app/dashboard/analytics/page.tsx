import AnalyticsSection from './analytics-section';

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Track your email delivery performance</p>
            </div>

            {/* Analytics Content */}
            <AnalyticsSection />
        </div>
    );
}
