// import React, { useState } from 'react';
// import { 
//   Home, User, Users, Calendar, BookOpen, FileText, 
//   ClipboardList, Bell, MessageSquare, LogOut, Search,
//   Menu, X, Mic, MicOff, Video, VideoOff, Phone,
//   Settings, Grid, Layout, Maximize2, ChevronDown
// } from 'lucide-react';

// // Reusable TopBar Component
// const TopBar = ({ onMenuToggle, isMobileMenuOpen, title = "Classroom" }) => {
//   return (
//     <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
//       <div className="flex items-center gap-4 flex-1">
//         <button 
//           onClick={onMenuToggle}
//           className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//         >
//           {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//         </button>
//         <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
//       </div>
      
//       <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
//         <div className="relative w-full">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//           <input
//             type="text"
//             placeholder="Search"
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>
      
//       <div className="flex items-center gap-3">
//         <button className="p-2 hover:bg-gray-100 rounded-lg relative">
//           <Bell size={20} className="text-gray-600" />
//         </button>
//         <button className="p-2 hover:bg-gray-100 rounded-lg">
//           <MessageSquare size={20} className="text-gray-600" />
//         </button>
//         <div className="flex items-center gap-2 ml-2">
//           <img 
//             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Swetha" 
//             alt="Profile" 
//             className="w-10 h-10 rounded-full"
//           />
//           <div className="hidden md:block">
//             <p className="text-sm font-semibold text-gray-800">Swetha shankaresh</p>
//             <p className="text-xs text-gray-500">Mentor</p>
//           </div>
//           <ChevronDown size={16} className="text-gray-400" />
//         </div>
//       </div>
//     </div>
//   );
// };

// // Reusable Sidebar Component
// const Sidebar = ({ isOpen, onClose }) => {
//   const menuItems = [
//     { icon: Home, label: 'Dashboard' },
//     { icon: User, label: 'Profile' },
//     { icon: Users, label: 'Students/Batches' },
//     { icon: Calendar, label: 'Attendance' },
//     { icon: BookOpen, label: 'Classroom', active: true },
//     { icon: FileText, label: 'Study Materials' },
//     { icon: ClipboardList, label: 'Assignments' },
//     { icon: FileText, label: 'Exams' },
//     { icon: Bell, label: 'Notifications' },
//     { icon: MessageSquare, label: 'Chats' },
//     { icon: MessageSquare, label: 'Feedback' },
//   ];

//   return (
//     <>
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
//           onClick={onClose}
//         />
//       )}
      
//       <div className={`
//         fixed lg:sticky top-0 left-0 h-screen bg-gray-50 border-r border-gray-200 
//         transition-transform duration-300 z-30 flex flex-col
//         ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//         w-64
//       `}>
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
//               <span className="text-white text-xl">🎓</span>
//             </div>
//             <span className="text-xl font-bold text-blue-500">Mentora</span>
//           </div>
//         </div>
        
//         <nav className="flex-1 p-4 overflow-y-auto">
//           {menuItems.map((item, index) => (
//             <button
//               key={index}
//               className={`
//                 w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1
//                 transition-colors duration-200
//                 ${item.active 
//                   ? 'bg-blue-100 text-blue-600' 
//                   : 'text-gray-600 hover:bg-gray-100'
//                 }
//               `}
//             >
//               <item.icon size={20} />
//               <span className="font-medium">{item.label}</span>
//             </button>
//           ))}
//         </nav>
        
//         <div className="p-4 space-y-2">
//           <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
//             <Calendar size={20} />
//             <span className="font-medium">Calendar</span>
//           </button>
//           <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
//             <LogOut size={20} />
//             <span className="font-medium">Logout</span>
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// // Video Grid Component
// const VideoGrid = ({ participants }) => {
//   return (
//     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-full">
//       {participants.map((participant, index) => (
//         <div 
//           key={index}
//           className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
//         >
//           <img 
//             src={participant.image}
//             alt={participant.name}
//             className="w-full h-full object-cover"
//           />
//           <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
//             {participant.name}
//           </div>
//           {!participant.micOn && (
//             <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-full">
//               <MicOff size={12} className="text-white" />
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// // Participants Panel Component
// const ParticipantsPanel = ({ activeTab, setActiveTab }) => {
//   const mentors = [
//     { name: 'Robin smith', micOn: true, videoOn: true },
//     { name: 'Arun Kumar', micOn: true, videoOn: true },
//   ];

//   const students = [
//     { name: 'Amit kumar', micOn: true, videoOn: true },
//     { name: 'Abishok kumar', micOn: true, videoOn: true },
//     { name: 'Bikesh kumar', micOn: true, videoOn: true },
//     { name: 'Clara john', micOn: true, videoOn: true },
//     { name: 'Deepthi manohar', micOn: true, videoOn: true },
//   ];

//   return (
//     <div className="bg-white h-full flex flex-col">
//       <div className="flex border-b">
//         <button
//           onClick={() => setActiveTab('participants')}
//           className={`flex-1 py-3 font-medium ${
//             activeTab === 'participants'
//               ? 'text-blue-600 border-b-2 border-blue-600'
//               : 'text-gray-600'
//           }`}
//         >
//           Participants
//         </button>
//         <button
//           onClick={() => setActiveTab('chat')}
//           className={`flex-1 py-3 font-medium ${
//             activeTab === 'chat'
//               ? 'text-blue-600 border-b-2 border-blue-600'
//               : 'text-gray-600'
//           }`}
//         >
//           Chat
//         </button>
//       </div>

//       {activeTab === 'participants' && (
//         <div className="flex-1 overflow-y-auto p-4">
//           <div className="mb-6">
//             <h3 className="font-semibold text-gray-800 mb-3">Mentors (2)</h3>
//             <div className="space-y-2">
//               {mentors.map((mentor, index) => (
//                 <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
//                   <div className="flex items-center gap-3">
//                     <img
//                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`}
//                       alt={mentor.name}
//                       className="w-8 h-8 rounded-full"
//                     />
//                     <span className="text-sm">{mentor.name}</span>
//                   </div>
//                   <div className="flex gap-2">
//                     <button className={`p-1 rounded ${mentor.micOn ? 'text-blue-600' : 'text-gray-400'}`}>
//                       {mentor.micOn ? <Mic size={16} /> : <MicOff size={16} />}
//                     </button>
//                     <button className={`p-1 rounded ${mentor.videoOn ? 'text-blue-600' : 'text-gray-400'}`}>
//                       {mentor.videoOn ? <Video size={16} /> : <VideoOff size={16} />}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div>
//             <h3 className="font-semibold text-gray-800 mb-3">Students (28)</h3>
//             <div className="space-y-2">
//               {students.map((student, index) => (
//                 <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
//                   <div className="flex items-center gap-3">
//                     <img
//                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
//                       alt={student.name}
//                       className="w-8 h-8 rounded-full"
//                     />
//                     <span className="text-sm">{student.name}</span>
//                   </div>
//                   <div className="flex gap-2">
//                     <button className={`p-1 rounded ${student.micOn ? 'text-blue-600' : 'text-gray-400'}`}>
//                       {student.micOn ? <Mic size={16} /> : <MicOff size={16} />}
//                     </button>
//                     <button className={`p-1 rounded ${student.videoOn ? 'text-blue-600' : 'text-gray-400'}`}>
//                       {student.videoOn ? <Video size={16} /> : <VideoOff size={16} />}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="mt-6 space-y-3">
//             <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
//               Mark attendance
//             </button>
//             <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
//               View Feedback
//             </button>
//           </div>
//         </div>
//       )}

//       {activeTab === 'chat' && (
//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 overflow-y-auto p-4">
//             <div className="text-center text-gray-500 text-sm">
//               No messages yet
//             </div>
//           </div>
//           <div className="p-4 border-t">
//             <input
//               type="text"
//               placeholder="Type a message..."
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Main Classroom Component
// const ClassroomPage = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState('participants');
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isVideoOn, setIsVideoOn] = useState(true);
//   const [viewMode, setViewMode] = useState('grid');

//   const participants = [
//     { name: 'Emma Watson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', micOn: true },
//     { name: 'John Doe', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', micOn: false },
//     { name: 'Sarah Johnson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', micOn: true },
//     { name: 'Mike Brown', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', micOn: true },
//     { name: 'Lisa Anderson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', micOn: true },
//     { name: 'David Wilson', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', micOn: false },
//     { name: 'Amy Taylor', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy', micOn: true },
//     { name: 'Chris Martin', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', micOn: true },
//   ];

//   return (
//     <div className="flex h-screen bg-gray-100 overflow-hidden">
//       <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <TopBar 
//           title="Classroom"
//           onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
//           isMobileMenuOpen={isSidebarOpen}
//         />
        
//         <div className="flex-1 flex overflow-hidden">
//           {/* Main Content Area */}
//           <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
//             {/* Live Indicator and Timer */}
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center gap-4">
//                 <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
//                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
//                   Live classroom
//                 </span>
//                 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg">
//                   <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                   <span className="text-sm font-mono">01:10:30</span>
//                 </div>
//               </div>
              
//               <div className="flex gap-2">
//                 <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
//                   <Settings size={20} className="text-gray-600" />
//                 </button>
//                 <button 
//                   onClick={() => setViewMode('grid')}
//                   className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
//                 >
//                   <Grid size={20} />
//                 </button>
//                 <button 
//                   onClick={() => setViewMode('sidebar')}
//                   className={`p-2 rounded-lg ${viewMode === 'sidebar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
//                 >
//                   <Layout size={20} />
//                 </button>
//                 <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
//                   <Maximize2 size={20} className="text-gray-600" />
//                 </button>
//               </div>
//             </div>

//             {/* Video Grid */}
//             <div className="flex-1 bg-gray-900 rounded-lg p-2 mb-4 overflow-hidden">
//               <VideoGrid participants={participants} />
//             </div>

//             {/* Controls */}
//             <div className="bg-white rounded-lg p-4 shadow-lg">
//               <div className="flex items-center justify-center gap-4">
//                 <button
//                   onClick={() => setIsMicOn(!isMicOn)}
//                   className={`p-4 rounded-full ${isMicOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'}`}
//                 >
//                   {isMicOn ? <Mic size={24} className="text-gray-700" /> : <MicOff size={24} className="text-white" />}
//                 </button>
//                 <button
//                   onClick={() => setIsVideoOn(!isVideoOn)}
//                   className={`p-4 rounded-full ${isVideoOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'}`}
//                 >
//                   {isVideoOn ? <Video size={24} className="text-gray-700" /> : <VideoOff size={24} className="text-white" />}
//                 </button>
//                 <button className="p-4 rounded-full bg-red-500 hover:bg-red-600">
//                   <Phone size={24} className="text-white transform rotate-135" />
//                 </button>
//               </div>
//             </div>

//             {/* Class Info */}
//             <div className="mt-4 bg-white rounded-lg p-4">
//               <h3 className="font-bold text-lg mb-2">Math Chapter 2</h3>
//               <h4 className="font-semibold text-gray-800 mb-2">Probability Theory</h4>
//               <p className="text-sm text-gray-600">
//                 Probability theory helps students to calculate the possibilities in cases like cards deck, heads and tails in coins,
//                 probability of winning the match, and more such equations. This is considered one of the most important math
//                 topics in the class 9 math syllabus and for students preparing for other Competitive exams.
//               </p>
              
//               <div className="flex gap-6 mt-4">
//                 <div className="flex items-center gap-2">
//                   <span className="text-gray-600">Present students</span>
//                   <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-semibold">28</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-gray-600">Absent people</span>
//                   <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">02</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Sidebar - Participants & Chat */}
//           <div className="hidden lg:block w-80 border-l border-gray-200 h-full">
//             <ParticipantsPanel activeTab={activeTab} setActiveTab={setActiveTab} />
//           </div>
//         </div>
//       </div>

//       {/* Mobile Participants Panel */}
//       <div className="lg:hidden fixed bottom-20 right-4 z-50">
//         <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg">
//           <Users size={24} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ClassroomPage;