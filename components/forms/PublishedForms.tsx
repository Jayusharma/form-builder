// import { prisma } from "@/lib/prisma";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ShareButton } from "@/components/ui/share-button";
// import Link from "next/link";
// import { CalendarDays, User } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

// async function getPublishedForms() {
//   const forms = await prisma.form.findMany({
//     where: {
//       isPublished: true
//     },
//     include: {
//       user: {
//         select: {
//           name: true,
//           email: true
//         }
//       },
//       _count: {
//         select: {
//           submissions: true
//         }
//       }
//     },
//     orderBy: {
//       updatedAt: 'desc'
//     }
//   });

//   return forms;
// }

// export default async function PublishedForms() {
//   const forms = await getPublishedForms();

//   if (forms.length === 0) {
//     return (
//       <div className="text-center py-10">
//         <h2 className="text-2xl font-semibold text-gray-900">No Published Forms</h2>
//         <p className="mt-2 text-gray-600">There are no published forms available at the moment.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//       {forms.map((form) => (
//         <Card key={form.id} className="hover:shadow-lg transition-shadow">
//           <CardHeader>
//             <CardTitle className="line-clamp-1">{form.title}</CardTitle>
//             <CardDescription className="line-clamp-2">
//               {form.description || "No description provided"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="flex items-center text-sm text-gray-500">
//                 <User className="mr-2 h-4 w-4" />
//                 <span>{form.user.name || form.user.email}</span>
//               </div>
//               <div className="flex items-center text-sm text-gray-500">
//                 <CalendarDays className="mr-2 h-4 w-4" />
//                 <span>Updated {formatDistanceToNow(form.updatedAt)} ago</span>
//               </div>
//               <div className="flex items-center justify-between pt-2">
//                 <div className="text-sm text-gray-500">
//                   {form._count.submissions} submission{form._count.submissions !== 1 ? 's' : ''}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// } 