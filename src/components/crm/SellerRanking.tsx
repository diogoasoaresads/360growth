"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";

interface SellerRankingProps {
    ranking: Array<{
        name: string;
        avatar?: string;
        deals?: number;
        revenue: number;
        conversion?: string;
    }>;
}

export function SellerRanking({ ranking }: SellerRankingProps) {
    return (
        <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Ranking de Performance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {ranking.map((seller, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            <div className="relative">
                                <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-primary transition-colors">
                                    <AvatarImage src={seller.avatar} />
                                    <AvatarFallback className="bg-slate-50 text-slate-600 font-bold">
                                        {seller.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                {i < 3 && (
                                    <div className="absolute -top-1 -right-1">
                                        {i === 0 && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                        {i === 1 && <Medal className="h-4 w-4 text-slate-400 fill-slate-400" />}
                                        {i === 2 && <Medal className="h-4 w-4 text-amber-700 fill-amber-700" />}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900 truncate">{seller.name}</p>
                                    <span className="text-sm font-black text-slate-900">
                                        {seller.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50 font-medium">
                                            {seller.deals || 0} Ganhos
                                        </Badge>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50 font-medium font-mono">
                                            {seller.conversion || "0%"} CV
                                        </Badge>
                                    </div>
                                    <div className="h-1 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${Math.min((seller.revenue / (ranking[0]?.revenue || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {ranking.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground italic text-sm">
                            Nenhum dado de performance disponível.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
