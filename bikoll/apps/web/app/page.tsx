import Sidebar from '../components/layout/Sidebar';
import KPICards from '../components/dashboard/KPICards';
import TimelineEvents from '../components/dashboard/TimelineEvents';
import DocumentSection from '../components/dashboard/DocumentSection';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">BiKwiq Översikt</h1>
          <p className="text-gray-500 text-lg">Välkommen tillbaka. Här är status för dina bigårdar.</p>
        </header>

        <KPICards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TimelineEvents />
          </div>

          <div className="space-y-8">
            <DocumentSection />

            {/* Context Widget */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 relative overflow-hidden group">
              <div className="absolute left-0 top-0 h-full w-1 bg-amber-400"></div>
              <h3 className="text-base font-bold text-gray-800 mb-2 pl-2">Synkning från fältet</h3>
              <p className="text-sm text-gray-500 leading-relaxed pl-2">
                Ljudinspelningar från mobilappen överförs och analyseras av AI automatiskt när du har täckning.
                Granska nya loggar under "Senaste händelser".
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
