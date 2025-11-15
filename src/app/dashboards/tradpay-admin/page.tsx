
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Landmark, AlertTriangle, Coins } from "lucide-react";
import React from 'react';

const walletAdjustments = [
    { id: 'ADJ001', user: 'SellerShop1', amount: -500, reason: 'Dispute Resolution DSP-001', status: 'Completed', admin: 'Alice' },
    { id: 'ADJ002', user: 'BuyerCo', amount: 1500, reason: 'Goodwill gesture for TKT-001', status: 'Pending Approval', admin: 'Bob' },
];

const escrowReleases = [
    { id: 'ESC001', orderId: 'ORD-006', amount: 450000, seller: 'Constructa Ltd', status: 'Awaiting Delivery Confirmation' },
    { id: 'ESC002', orderId: 'ORD-007', amount: 85000, seller: 'GreenFarms', status: 'Released' },
];

export default function TradePayAdminDashboard() {
    React.useEffect(() => {
        document.title = 'TradePay Admin | Tradinta';
    }, []);

    return (
        <Tabs defaultValue="adjustments">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adjustments">Wallet Adjustments</TabsTrigger>
                <TabsTrigger value="escrow">Escrow Management</TabsTrigger>
                <TabsTrigger value="tradcoin">TradCoin Logic</TabsTrigger>
            </TabsList>

            <TabsContent value="adjustments">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Manual Wallet Adjustments</CardTitle>
                                <CardDescription>Manually credit or debit user wallets for support or correction purposes.</CardDescription>
                            </div>
                            <Button>New Adjustment</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Amount (KES)</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Initiated By</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {walletAdjustments.map((adj) => (
                                    <TableRow key={adj.id}>
                                        <TableCell className="font-medium">{adj.user}</TableCell>
                                        <TableCell className={adj.amount > 0 ? "text-green-600" : "text-red-600"}>{adj.amount.toLocaleString()}</TableCell>
                                        <TableCell>{adj.reason}</TableCell>
                                        <TableCell><Badge variant={adj.status === 'Completed' ? 'secondary' : 'default'}>{adj.status}</Badge></TableCell>
                                        <TableCell>{adj.admin}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" disabled={adj.status !== 'Pending Approval'}>Approve</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="escrow">
                <Card>
                    <CardHeader>
                        <CardTitle>Escrow Management</CardTitle>
                        <CardDescription>Monitor and manually release funds held in escrow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Amount (KES)</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {escrowReleases.map((escrow) => (
                                    <TableRow key={escrow.id}>
                                        <TableCell className="font-medium">{escrow.orderId}</TableCell>
                                        <TableCell>{escrow.amount.toLocaleString()}</TableCell>
                                        <TableCell>{escrow.seller}</TableCell>
                                        <TableCell><Badge variant="outline">{escrow.status}</Badge></TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="destructive" disabled={escrow.status === 'Released'}><Landmark className="mr-2 h-4 w-4"/> Release Funds</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="tradcoin">
                <Card>
                    <CardHeader>
                        <CardTitle>TradCoin Conversion Logic</CardTitle>
                        <CardDescription>Monitor the technical aspects of TradPoints to $Trad conversions and blockchain transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
                           <Coins className="h-16 w-16 text-muted-foreground" />
                           <p className="ml-4 text-muted-foreground">TradCoin Logic & Monitoring Component Here</p>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
