'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const airdropPhases = [
    { id: 'phase1', name: 'Phase 1: Early Adopters', status: 'Completed', claimed: '1.2M / 1.2M' },
    { id: 'phase2', name: 'Phase 2: Verified Sellers', status: 'Active', claimed: '750K / 2.0M', progress: 37.5 },
    { id: 'phase3', name: 'Phase 3: Public Launch', status: 'Upcoming', claimed: '0 / 5.0M' },
];

export default function AirdropOverview() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>TradCoin Airdrop Overview</CardTitle>
                <CardDescription>Oversee the distribution of $Trad tokens converted from TradPoints.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Airdrop Phase</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Claimed $Trad</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {airdropPhases.map((phase) => (
                            <TableRow key={phase.id}>
                                <TableCell className="font-medium">{phase.name}</TableCell>
                                <TableCell><Badge variant={phase.status === 'Active' ? 'default' : 'outline'}>{phase.status}</Badge></TableCell>
                                <TableCell>{phase.claimed}</TableCell>
                                <TableCell>{phase.progress ? <Progress value={phase.progress} className="w-[60%]" /> : 'N/A'}</TableCell>
                                <TableCell><Button variant="outline" size="sm" disabled={phase.status !== 'Active'}>Manage Phase</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
