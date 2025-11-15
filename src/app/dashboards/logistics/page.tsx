
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Check, Package } from "lucide-react";
import React from 'react';

const assignedShipments = [
    { id: 'SHIP-00A1', orderId: 'ORD-006', from: 'Nairobi', to: 'Mombasa', status: 'In Transit', expected: '2023-11-16' },
    { id: 'SHIP-00B2', orderId: 'ORD-007', from: 'Eldoret', to: 'Kisumu', status: 'Out for Delivery', expected: '2023-11-15' },
    { id: 'SHIP-00C3', orderId: 'ORD-008', from: 'Thika', to: 'Nairobi', status: 'Pending Pickup', expected: '2023-11-17' },
];

const deliveryHistory = [
    { id: 'SHIP-00X9', orderId: 'ORD-001', to: 'Nairobi', status: 'Delivered', date: '2023-10-26' },
    { id: 'SHIP-00Y8', orderId: 'ORD-002', to: 'Nakuru', status: 'Delivered', date: '2023-10-25' },
];

export default function LogisticsDashboard() {
    React.useEffect(() => {
        document.title = 'Logistics Dashboard | Tradinta';
    }, []);

    return (
        <Tabs defaultValue="assigned">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assigned">Assigned Shipments</TabsTrigger>
                <TabsTrigger value="history">Delivery History</TabsTrigger>
                <TabsTrigger value="performance">My Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned">
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Shipments</CardTitle>
                        <CardDescription>View and manage shipments currently assigned to you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shipment ID</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expected Delivery</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedShipments.map((shipment) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell className="font-medium">{shipment.id}</TableCell>
                                        <TableCell>{shipment.from}</TableCell>
                                        <TableCell>{shipment.to}</TableCell>
                                        <TableCell><Badge variant="default">{shipment.status}</Badge></TableCell>
                                        <TableCell>{shipment.expected}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm"><MapPin className="mr-2 h-4 w-4"/> View Route</Button>
                                            <Button size="sm">Update Status</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery History</CardTitle>
                        <CardDescription>Your record of completed deliveries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shipment ID</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Completion Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deliveryHistory.map((delivery) => (
                                    <TableRow key={delivery.id}>
                                        <TableCell className="font-medium">{delivery.id}</TableCell>
                                        <TableCell>{delivery.orderId}</TableCell>
                                        <TableCell>{delivery.to}</TableCell>
                                        <TableCell><Badge variant="secondary"><Check className="mr-1 h-3 w-3"/>{delivery.status}</Badge></TableCell>
                                        <TableCell>{delivery.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="performance">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Performance</CardTitle>
                        <CardDescription>Metrics on your delivery efficiency and ratings.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">On-Time Delivery Rate</CardTitle>
                                <Truck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">98.5%</div>
                                <p className="text-xs text-muted-foreground">Last 30 days</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Delivery Time</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">2.1 Days</div>
                                <p className="text-xs text-muted-foreground">Within county</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                                <Check className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">4.9/5.0</div>
                                <p className="text-xs text-muted-foreground">Based on 150 reviews</p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
