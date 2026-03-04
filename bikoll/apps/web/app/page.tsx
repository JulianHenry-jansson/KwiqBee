import Link from 'next/link';

export default function Dashboard() {
  const apiaries = [
    {
      id: 'apiary-1',
      name: 'Bigård A',
      hives: [
        { id: '1', name: 'Bikupa 1' },
        { id: '2', name: 'Bikupa 2' },
        { id: '3', name: 'Bikupa 3' },
      ],
    },
  ];

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">BiKoll Dashboard</h1>
      <div className="space-y-8">
        {apiaries.map((apiary) => (
          <section key={apiary.id} className="border p-6 rounded-lg shadow-sm bg-white text-gray-800">
            <h2 className="text-2xl font-semibold mb-4">{apiary.name}</h2>
            <ul className="space-y-2">
              {apiary.hives.map((hive) => (
                <li key={hive.id}>
                  <Link href={`/hives/${hive.id}`} className="text-blue-600 hover:underline text-lg block p-2 rounded hover:bg-gray-50">
                    {hive.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
