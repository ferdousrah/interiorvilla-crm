export default function StatCard({ label, value, icon: Icon, delta, color = 'primary' }) {
    const colors = {
        primary: 'bg-primary-50 text-primary-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        blue: 'bg-blue-50 text-blue-600',
    };

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {delta !== undefined && (
                        <p className={`text-xs mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {delta >= 0 ? '+' : ''}{delta}% from last month
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
}
