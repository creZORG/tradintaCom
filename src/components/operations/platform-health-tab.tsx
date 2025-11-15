'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, FileWarning, Handshake } from "lucide-react";

export function PlatformHealthTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Health & Monitoring</CardTitle>
        <CardDescription>Overview of system status and performance metrics.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-center p-4">
          <CheckCircle className="h-8 w-8 text-green-500 mr-4"/>
          <div>
            <p className="font-bold">API Status</p>
            <p className="text-sm text-green-500">All Systems Operational</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <Clock className="h-8 w-8 text-muted-foreground mr-4"/>
          <div>
            <p className="font-bold">Average Response Time</p>
            <p className="text-sm">120ms</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <FileWarning className="h-8 w-8 text-yellow-500 mr-4"/>
          <div>
            <p className="font-bold">Error Rate</p>
            <p className="text-sm">0.05%</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <Handshake className="h-8 w-8 text-blue-500 mr-4"/>
          <div>
            <p className="font-bold">Payment Gateway</p>
            <p className="text-sm text-green-500">Connected</p>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
