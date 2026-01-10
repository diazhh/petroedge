import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, TrendingUp } from 'lucide-react';
import { useWellTests } from '../features/well-testing/api/wellTestingApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Select, SelectOption } from '../components/ui/select-legacy';
import { Input } from '../components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { TestStatus } from '../features/well-testing/types';

const statusColors: Record<TestStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ANALYZED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-800',
};

export default function WellTestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: wellTestsData, isLoading: isLoadingTests } = useWellTests({
    status: statusFilter || undefined,
  });

  const wellTests = wellTestsData?.data || [];

  const filteredTests = wellTests.filter((test) => {
    const matchesSearch =
      test.testNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.well?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.well?.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('es-VE', { maximumFractionDigits: 2 });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Well Tests</h1>
          <p className="text-muted-foreground">
            Manage well testing operations and analyze production data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wellTests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wellTests.filter((t) => t.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">Active tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wellTests.filter((t) => t.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Oil Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                wellTests.reduce((sum, t) => sum + (t.oilRateBopd || 0), 0) / wellTests.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">BOPD</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter well tests by status and search criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by test number, well name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[200px]"
            >
              <SelectOption value="">All Status</SelectOption>
              <SelectOption value="PLANNED">Planned</SelectOption>
              <SelectOption value="IN_PROGRESS">In Progress</SelectOption>
              <SelectOption value="COMPLETED">Completed</SelectOption>
              <SelectOption value="ANALYZED">Analyzed</SelectOption>
              <SelectOption value="APPROVED">Approved</SelectOption>
              <SelectOption value="CANCELLED">Cancelled</SelectOption>
              <SelectOption value="SUSPENDED">Suspended</SelectOption>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Well Tests</CardTitle>
          <CardDescription>
            {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTests ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Number</TableHead>
                  <TableHead>Well</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Oil Rate (BOPD)</TableHead>
                  <TableHead className="text-right">Water Cut (%)</TableHead>
                  <TableHead className="text-right">GOR (SCF/STB)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No well tests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.testNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{test.well?.name}</div>
                          <div className="text-sm text-muted-foreground">{test.well?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{test.testType?.name || '-'}</TableCell>
                      <TableCell>{formatDate(test.testDate)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[test.status]}>
                          {test.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(test.oilRateBopd)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(test.waterCutPercent)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(test.gorScfStb)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/well-tests/${test.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
