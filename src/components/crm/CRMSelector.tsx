"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SelectorProps {
    items: { id: string; name: string }[];
    defaultValue?: string;
    paramName: string;
    placeholder: string;
    label: string;
}

export function CRMSelector({ items, defaultValue, paramName, placeholder, label }: SelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramName, value);

        // If changing client, reset pipeline
        if (paramName === "clientId") {
            params.delete("pipelineId");
        }

        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-1.5 min-w-[200px]">
            <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{label}</span>
            <Select defaultValue={defaultValue} onValueChange={handleValueChange}>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
