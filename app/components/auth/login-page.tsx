// "use client";

// import type React from "react";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { useApp } from "../../context/app-context";
// import { Store, User, Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";

// export default function LoginPage() {
//   const { login, stores, isOnline, storesLoading } = useApp();
//   const [formData, setFormData] = useState({
//     login: "",
//     password: "",
//     storeId: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!formData.login || !formData.password) {
//       setError("Заповніть всі поля");
//       return;
//     }

//     if (!isOnline) {
//       setError("Для входу потрібен інтернет");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const success = await login(
//         formData.login,
//         formData.password,
//         formData.storeId
//       );
//       if (!success) {
//         setError("Невірний логін або пароль");
//       }
//     } catch (error) {
//       setError("Помилка входу. Спробуйте ще раз");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
//             <Store className="h-8 w-8 text-white" />
//           </div>
//           <CardTitle className="text-2xl font-bold">BadPhone</CardTitle>
//           <p className="text-gray-600">Система управління продажами</p>

//           <div className="flex items-center justify-center gap-2 mt-4">
//             {isOnline ? (
//               <Badge
//                 variant="outline"
//                 className="bg-green-50 text-green-700 border-green-200"
//               >
//                 <Wifi className="h-3 w-3 mr-1" />
//                 Онлайн
//               </Badge>
//             ) : (
//               <Badge
//                 variant="outline"
//                 className="bg-red-50 text-red-700 border-red-200"
//               >
//                 <WifiOff className="h-3 w-3 mr-1" />
//                 Офлайн
//               </Badge>
//             )}
//           </div>
//         </CardHeader>

//         <CardContent>
//           {!isOnline && (
//             <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//               <div className="flex items-center gap-2 text-yellow-800">
//                 <AlertCircle className="h-4 w-4" />
//                 <span className="text-sm">Немає підключення до інтернету</span>
//               </div>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Логін</label>
//               <Input
//                 type="text"
//                 value={formData.login}
//                 onChange={(e) =>
//                   setFormData({ ...formData, login: e.target.value })
//                 }
//                 placeholder="Введіть ваш логін"
//                 disabled={isLoading || !isOnline}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Пароль</label>
//               <Input
//                 type="password"
//                 value={formData.password}
//                 onChange={(e) =>
//                   setFormData({ ...formData, password: e.target.value })
//                 }
//                 placeholder="Введіть ваш пароль"
//                 disabled={isLoading || !isOnline}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Магазин</label>
//               {storesLoading ? (
//                 <div className="flex items-center justify-center p-3 border rounded-md bg-gray-50">
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                   <span className="text-sm text-gray-600">
//                     Завантаження магазинів...
//                   </span>
//                 </div>
//               ) : (
//                 <Select
//                   value={formData.storeId}
//                   onValueChange={(value) =>
//                     setFormData({ ...formData, storeId: value })
//                   }
//                   disabled={isLoading || !isOnline}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Виберіть магазин" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {stores.map((store) => (
//                       <SelectItem key={store.id} value={store.id}>
//                         <div className="flex items-center gap-2">
//                           <Store className="h-4 w-4" />
//                           <span>{store.name}</span>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               )}
//             </div>

//             {error && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <div className="flex items-center gap-2 text-red-800">
//                   <AlertCircle className="h-4 w-4" />
//                   <span className="text-sm">{error}</span>
//                 </div>
//               </div>
//             )}

//             <Button
//               type="submit"
//               className="w-full bg-black hover:bg-gray-800"
//               disabled={
//                 isLoading || !isOnline || storesLoading || !formData.storeId
//               }
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                   Вхід...
//                 </>
//               ) : (
//                 <>
//                   <User className="h-4 w-4 mr-2" />
//                   Увійти
//                 </>
//               )}
//             </Button>
//           </form>

//           <div className="mt-6 pt-4 border-t text-center">
//             <p className="text-xs text-gray-500">
//               Версія 1.0.1 • © 2024 BadPhone
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApp } from "../../context/app-context";
import { Store, User, Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, stores, isOnline, storesLoading } = useApp();
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    storeId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.login || !formData.password) {
      setError("Заповніть всі поля");
      return;
    }

    if (!isOnline) {
      setError("Для входу потрібен інтернет");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(
        formData.login,
        formData.password,
        formData.storeId
      );
      if (!success) {
        setError("Невірний логін або пароль");
      }
    } catch (error) {
      setError("Помилка входу. Спробуйте ще раз");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-950 overflow-hidden">
      {/* Мерцающие светлячки */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-yellow-200 rounded-full opacity-70 animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Карточка входа */}
      <Card className="w-full max-w-md bg-black/70 backdrop-blur-md border border-purple-700 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-900 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            BadPhone
          </CardTitle>
          <p className="text-gray-300">Система управління продажами</p>

          <div className="flex items-center justify-center gap-2 mt-4">
            {isOnline ? (
              <Badge className="bg-green-600 text-white border-green-700">
                <Wifi className="h-3 w-3 mr-1" />
                Онлайн
              </Badge>
            ) : (
              <Badge className="bg-red-600 text-white border-red-700">
                <WifiOff className="h-3 w-3 mr-1" />
                Офлайн
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-700/20 border border-yellow-600 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Немає підключення до інтернету</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Логін
              </label>
              <Input
                type="text"
                value={formData.login}
                onChange={(e) =>
                  setFormData({ ...formData, login: e.target.value })
                }
                placeholder="Введіть ваш логін"
                disabled={isLoading || !isOnline}
                className="bg-gray-900 text-white placeholder-gray-400 border-purple-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Пароль
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Введіть ваш пароль"
                disabled={isLoading || !isOnline}
                className="bg-gray-900 text-white placeholder-gray-400 border-purple-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Магазин
              </label>
              {storesLoading ? (
                <div className="flex items-center justify-center p-3 border rounded-md bg-gray-800 text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Завантаження магазинів...
                </div>
              ) : (
                <Select
                  value={formData.storeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, storeId: value })
                  }
                  disabled={isLoading || !isOnline}
                >
                  <SelectTrigger className="bg-gray-900 text-white border border-purple-700">
                    <SelectValue placeholder="Виберіть магазин" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>{store.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-700/20 border border-red-600 rounded-lg">
                <div className="flex items-center gap-2 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white transition-all duration-300 shadow-md"
              disabled={
                isLoading || !isOnline || storesLoading || !formData.storeId
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Вхід...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Увійти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-purple-700 text-center text-gray-300">
            Версія 1.0.1 • © 2025 BadPhone
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
