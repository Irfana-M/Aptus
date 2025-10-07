export const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // now it can be a hex like '#49BBBD'
}) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
    </div>
  </div>
);
