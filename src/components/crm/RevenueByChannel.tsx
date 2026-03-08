"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChannelMetric } from "@/lib/actions/crm-reports.actions";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

interface RevenueByChannelProps {
    data: ChannelMetric[];
}

export function RevenueByChannel({ data }: RevenueByChannelProps) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Receita por Canal (ADS → CRM)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500">
                    Real-time
                </Badge>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Canal</TableHead>
                            <TableHead className="text-right">Leads/Deals</TableHead>
                            <TableHead className="text-right">Ganhos</TableHead>
                            <TableHead className="text-right">Conversão</TableHead>
                            <TableHead className="text-right">Ticket Médio</TableHead>
                            <TableHead className="text-right font-bold text-slate-900">Receita</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                    Nenhum dado de atribuição encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.channel} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${item.channel.toLowerCase().includes('google') ? 'bg-blue-500' :
                                                    item.channel.toLowerCase().includes('meta') || item.channel.toLowerCase().includes('facebook') ? 'bg-indigo-500' :
                                                        'bg-slate-300'
                                                }`} />
                                            {item.channel}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-slate-600">{item.leads}</TableCell>
                                    <TableCell className="text-right text-slate-600">{item.won}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px]">
                                            {item.conversionRate.toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-slate-600">
                                        {item.avgTicket.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        {item.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Leads Totais
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                            {data.reduce((sum, item) => sum + item.leads, 0)}
                        </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Conversão Média
                        </span>
                        <span className="text-xl font-bold text-emerald-600">
                            {(data.reduce((sum, item) => sum + item.conversionRate, 0) / (data.length || 1)).toFixed(1)}%
                        </span>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-primary/60 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Receita Total
                        </span>
                        <span className="text-xl font-bold text-primary">
                            {data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
