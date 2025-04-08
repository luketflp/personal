export default function TimelineMap() {
    const steps = [
      {
        title: "São Paulo - Departure",
        description: "Leaving home and heading to the airport.",
        date: "May 1, 2025",
      },
      {
        title: "Arrival in Bonito",
        description: "Check-in at the hotel, first views of paradise.",
        date: "May 2, 2025",
      },
      {
        title: "Abismo Anhumas",
        description: "Epic descent into the cave, scuba diving adventure.",
        date: "May 3, 2025",
      },
      {
        title: "Rio da Prata",
        description: "Snorkeling in crystal-clear waters with colorful fish.",
        date: "May 4, 2025",
      },
      {
        title: "Return Home",
        description: "Time to go back, memories in the bag.",
        date: "May 5, 2025",
      },
    ];
  
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 h-full border-l-2 border-gray-200" />
  
        <ul className="space-y-12">
          {steps.map((step, index) => (
            <li key={index} className="relative pl-12">
              {/* Dot */}
              <div className="absolute left-0 top-1.5 w-3 h-3 bg-sky-500 rounded-full border-4 border-white shadow-md" />
  
              <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.date}</p>
                <p className="mt-2 text-gray-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  