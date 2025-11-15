
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Download } from 'lucide-react';
import { generateRevenueReport, generatePayoutsReport, generateTransactionLedger } from '@/app/lib/actions/reporting';
import { format, subMonths } from 'date-fns';

type ReportType = 'revenue' | 'payouts' | 'ledger';

export function ReportingTab() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [reportType, setReportType] = React.useState<ReportType>('revenue');
    
    // State for date selections
    const [revenueMonth, setRevenueMonth] = React.useState(format(new Date(), 'yyyy-MM'));
    const [ledgerStart, setLedgerStart] = React.useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [ledgerEnd, setLedgerEnd] = React.useState(format(new Date(), 'yyyy-MM-dd'));

    const downloadCsv = (csvString: string, filename: string) => {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            let csvData: string;
            let filename: string;

            switch (reportType) {
                case 'revenue':
                    csvData = await generateRevenueReport(revenueMonth);
                    filename = `tradinta_revenue_report_${revenueMonth}.csv`;
                    break;
                case 'payouts':
                    csvData = await generatePayoutsReport();
                    filename = 'tradinta_payouts_report.csv';
                    break;
                case 'ledger':
                    if (!ledgerStart || !ledgerEnd) {
                        toast({ title: 'Please select a date range for the ledger.', variant: 'destructive' });
                        setIsLoading(false);
                        return;
                    }
                    csvData = await generateTransactionLedger(ledgerStart, ledgerEnd);
                    filename = `tradinta_ledger_${ledgerStart}_to_${ledgerEnd}.csv`;
                    break;
                default:
                    throw new Error('Invalid report type selected.');
            }
            
            downloadCsv(csvData, filename);
            toast({ title: 'Report Generated', description: `${filename} has been downloaded.`});

        } catch (error: any) {
            toast({ title: 'Error Generating Report', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Reporting</CardTitle>
                <CardDescription>Generate and download financial reports for auditing and analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                            <SelectTrigger id="report-type">
                                <SelectValue placeholder="Select a report" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="revenue">Monthly Revenue Report</SelectItem>
                                <SelectItem value="payouts">Payouts & Withdrawals</SelectItem>
                                <SelectItem value="ledger">Full Transaction Ledger</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {reportType === 'revenue' && (
                        <div className="grid gap-2">
                            <Label htmlFor="revenue-month">Month</Label>
                            <Input id="revenue-month" type="month" value={revenueMonth} onChange={(e) => setRevenueMonth(e.target.value)} />
                        </div>
                    )}
                     {reportType === 'ledger' && (
                        <div className="grid grid-cols-2 gap-2">
                             <div className="grid gap-2">
                                <Label htmlFor="ledger-start">Start Date</Label>
                                <Input id="ledger-start" type="date" value={ledgerStart} onChange={e => setLedgerStart(e.target.value)} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="ledger-end">End Date</Label>
                                <Input id="ledger-end" type="date" value={ledgerEnd} onChange={e => setLedgerEnd(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Generate & Download Report'}
                </Button>
            </CardFooter>
        </Card>
    );
}
