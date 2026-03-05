"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { createTicket } from "@/lib/actions/ticket.actions";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validations/ticket";
import type { Client } from "@/lib/db/schema";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface NewTicketDialogProps {
    clients: Pick<Client, "id" | "name">[];
}

export function NewTicketDialog({ clients }: NewTicketDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const form = useForm<CreateTicketInput>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            subject: "",
            clientId: "",
            priority: "MEDIUM",
            type: "SUPPORT",
            message: "",
        },
    });

    async function onSubmit(data: CreateTicketInput) {
        try {
            await createTicket(data);
            toast.success("Ticket criado com sucesso!");
            setOpen(false);
            form.reset();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao criar ticket");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Ticket</DialogTitle>
                    <DialogDescription>
                        Abra uma nova solicitação e atribua a um cliente.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assunto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Dúvida sobre faturamento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um cliente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SUPPORT">Suporte</SelectItem>
                                                <SelectItem value="FEATURE_REQUEST">Melhoria</SelectItem>
                                                <SelectItem value="BUG">Problema/Bug</SelectItem>
                                                <SelectItem value="BILLING">Financeiro</SelectItem>
                                                <SelectItem value="OTHER">Outros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LOW">Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                                <SelectItem value="HIGH">Alta</SelectItem>
                                                <SelectItem value="URGENT">Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mensagem Inicial</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva a solicitação ou problema em detalhes..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Criar Ticket
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
