export default function StatCard({ emoji, label, value, gradient }) {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-sm`}>
            <p className="text-3xl mb-1">{emoji}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </div>
    );
}
