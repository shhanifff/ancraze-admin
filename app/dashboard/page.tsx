"use client";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import {
  Users,
  Presentation,
  UserPlus,
  Wallet,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const roleValue = Cookies.get("role");
    setRole(roleValue);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 md:space-y-10 pb-12 px-1 sm:px-0">
      {/* Header Section - Responsive stacking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Platform <span className="text-[#2A0066]">Analytics</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Welcome back,{" "}
            <span className="text-[#2A0066] font-bold uppercase">
              {role || "Admin"}
            </span>
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-[#2A0066] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#2A0066]/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          onClick={() => router.push("/dashboard/addCourse")}
        >
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {/* Main KPI Grid - 1 col on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          label="Total Students"
          value="4,280"
          icon={<Users size={22} />}
          percentage="+8% from last month"
        />
        <KPICard
          label="Total Classes"
          value="156"
          icon={<Presentation size={22} />}
          percentage="Active Courses"
        />
        <KPICard
          label="This Month Joinees"
          value="214"
          icon={<UserPlus size={22} />}
          percentage="↑ New Registrations"
          isHighlight
        />
        <KPICard
          label="Total Revenue"
          value="$12,450"
          icon={<Wallet size={22} />}
          percentage="Net Earnings"
        />
      </div>

      {/* Table Section - Full Width with Horizontal Scroll for Mobile */}
      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Recent Joinees
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs font-medium mt-1">
              Real-time update of students joining
            </p>
          </div>
          <button className="text-[#2A0066] font-bold text-xs md:text-sm hover:underline whitespace-nowrap cursor-pointer">
            View All Students
          </button>
        </div>

        {/* Horizontal scroll container for small screens */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-5 md:px-8 py-4 text-left">Student Name</th>
                <th className="px-5 md:px-8 py-4 text-left">Selected Course</th>
                <th className="px-5 md:px-8 py-4 text-left">Enrollment Date</th>
                <th className="px-5 md:px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <StudentRow
                name="Alex Rivera"
                classType="Fullstack Web Development"
                date="Jan 12, 2026"
              />
              <StudentRow
                name="Mila Kunis"
                classType="UI/UX Masterclass"
                date="Jan 10, 2026"
              />
              <StudentRow
                name="Jordan Singh"
                classType="Python Data Science"
                date="Jan 08, 2026"
              />
              <StudentRow
                name="Elena Gilbert"
                classType="Cloud Architecture"
                date="Jan 05, 2026"
              />
              <StudentRow
                name="Marcus Wright"
                classType="Digital Marketing"
                date="Jan 02, 2026"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Responsive Helper Components ---

function KPICard({
  label,
  value,
  icon,
  percentage,
  isHighlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  percentage: string;
  isHighlight?: boolean;
}) {
  return (
    <motion.div className="p-5 md:p-7 rounded-2xl cursor-pointer border transition-all duration-300 bg-white border-slate-100 shadow-sm hover:shadow-md ">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div
          className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl ${isHighlight ? "bg-[#2A0066] text-white" : "bg-[#2A0066]/5 text-[#2A0066]"}`}
        >
          {icon}
        </div>
        <button className="text-slate-300 cursor-pointer">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div>
        <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">
          {label}
        </p>
        <h4 className="text-xl md:text-3xl font-black text-slate-900 mt-1">
          {value}
        </h4>
        <p
          className={`text-[9px] md:text-[10px] font-bold mt-2 ${isHighlight ? "text-[#2A0066]" : "text-slate-400"}`}
        >
          {percentage}
        </p>
      </div>
    </motion.div>
  );
}

function StudentRow({
  name,
  classType,
  date,
}: {
  name: string;
  classType: string;
  date: string;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
      <td className="px-5 md:px-8 py-4 md:py-6 ">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-[#2A0066]/5 flex items-center justify-center font-bold text-[#2A0066] border border-[#2A0066]/10 group-hover:bg-[#2A0066] group-hover:text-white transition-all">
            {name.charAt(0)}
          </div>
          <span className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-[#2A0066] transition-colors">
            {name}
          </span>
        </div>
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6 text-xs md:text-sm text-slate-500 font-semibold">
        {classType}
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6 text-[10px] md:text-sm text-slate-400 font-medium whitespace-nowrap">
        {date}
      </td>
      <td className="px-5 md:px-8 py-4 md:py-6 text-right">
        <button className="text-slate-300 hover:text-[#2A0066] transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </td>
    </tr>
  );
}
