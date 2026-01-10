import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../common/database';
import {
  wellTests,
  testTypes,
  testReadings,
  iprAnalyses,
  vlpAnalyses,
  nodalAnalyses,
  wells,
  type WellTest,
  type NewWellTest,
  type TestType,
  type TestReading,
  type NewTestReading,
  type IprAnalysis,
  type NewIprAnalysis,
  type VlpAnalysis,
  type NewVlpAnalysis,
  type NodalAnalysis,
  type NewNodalAnalysis,
} from '../../common/database/schema';

export interface ListWellTestsFilters {
  tenantId: string;
  wellId?: string;
  testTypeId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class WellTestingRepository {
  // ============================================================================
  // WELL TESTS
  // ============================================================================

  async createWellTest(data: NewWellTest): Promise<WellTest> {
    const [wellTest] = await db.insert(wellTests).values(data).returning();
    return wellTest;
  }

  async findWellTestById(id: string, tenantId: string): Promise<WellTest | undefined> {
    const [wellTest] = await db
      .select()
      .from(wellTests)
      .where(and(eq(wellTests.id, id), eq(wellTests.tenantId, tenantId)));
    return wellTest;
  }

  async findWellTestWithRelations(id: string, tenantId: string) {
    const [result] = await db
      .select({
        wellTest: wellTests,
        well: wells,
        testType: testTypes,
      })
      .from(wellTests)
      .leftJoin(wells, eq(wellTests.wellId, wells.id))
      .leftJoin(testTypes, eq(wellTests.testTypeId, testTypes.id))
      .where(and(eq(wellTests.id, id), eq(wellTests.tenantId, tenantId)));
    
    return result;
  }

  async listWellTests(filters: ListWellTestsFilters) {
    const {
      tenantId,
      wellId,
      testTypeId,
      status,
      fromDate,
      toDate,
      page = 1,
      perPage = 20,
      sort = 'testDate',
      order = 'desc',
    } = filters;

    const conditions = [eq(wellTests.tenantId, tenantId)];

    if (wellId) {
      conditions.push(eq(wellTests.wellId, wellId));
    }
    if (testTypeId) {
      conditions.push(eq(wellTests.testTypeId, testTypeId));
    }
    if (status) {
      conditions.push(eq(wellTests.status, status as any));
    }
    if (fromDate) {
      conditions.push(gte(wellTests.testDate, new Date(fromDate)));
    }
    if (toDate) {
      conditions.push(lte(wellTests.testDate, new Date(toDate)));
    }

    const offset = (page - 1) * perPage;
    const orderColumn = sort === 'testDate' ? wellTests.testDate : wellTests.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          wellTest: wellTests,
          well: wells,
          testType: testTypes,
        })
        .from(wellTests)
        .leftJoin(wells, eq(wellTests.wellId, wells.id))
        .leftJoin(testTypes, eq(wellTests.testTypeId, testTypes.id))
        .where(and(...conditions))
        .orderBy(orderFn(orderColumn))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(wellTests)
        .where(and(...conditions)),
    ]);

    return {
      items,
      total: count,
      page,
      perPage,
    };
  }

  async updateWellTest(
    id: string,
    tenantId: string,
    data: Partial<NewWellTest>
  ): Promise<WellTest | undefined> {
    const [updated] = await db
      .update(wellTests)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(wellTests.id, id), eq(wellTests.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteWellTest(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(wellTests)
      .where(and(eq(wellTests.id, id), eq(wellTests.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async generateTestNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WT-${year}-`;

    const [lastTest] = await db
      .select({ testNumber: wellTests.testNumber })
      .from(wellTests)
      .where(
        and(
          eq(wellTests.tenantId, tenantId),
          sql`${wellTests.testNumber} LIKE ${prefix}%`
        )
      )
      .orderBy(desc(wellTests.testNumber))
      .limit(1);

    if (!lastTest) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastTest.testNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  }

  // ============================================================================
  // TEST TYPES
  // ============================================================================

  async findTestTypeById(id: string, tenantId: string): Promise<TestType | undefined> {
    const [testType] = await db
      .select()
      .from(testTypes)
      .where(and(eq(testTypes.id, id), eq(testTypes.tenantId, tenantId)));
    return testType;
  }

  async listTestTypes(tenantId: string): Promise<TestType[]> {
    return db
      .select()
      .from(testTypes)
      .where(and(eq(testTypes.tenantId, tenantId), eq(testTypes.isActive, true)));
  }

  // ============================================================================
  // TEST READINGS
  // ============================================================================

  async createTestReading(data: NewTestReading): Promise<TestReading> {
    const [reading] = await db.insert(testReadings).values(data).returning();
    return reading;
  }

  async listTestReadings(wellTestId: string): Promise<TestReading[]> {
    return db
      .select()
      .from(testReadings)
      .where(eq(testReadings.wellTestId, wellTestId))
      .orderBy(asc(testReadings.readingTime));
  }

  async deleteTestReading(id: string): Promise<boolean> {
    const result = await db.delete(testReadings).where(eq(testReadings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================================================
  // IPR ANALYSES
  // ============================================================================

  async createIprAnalysis(data: NewIprAnalysis): Promise<IprAnalysis> {
    const [analysis] = await db.insert(iprAnalyses).values(data).returning();
    return analysis;
  }

  async findIprAnalysisById(id: string): Promise<IprAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(iprAnalyses)
      .where(eq(iprAnalyses.id, id));
    return analysis;
  }

  async listIprAnalysesByWellTest(wellTestId: string): Promise<IprAnalysis[]> {
    return db
      .select()
      .from(iprAnalyses)
      .where(eq(iprAnalyses.wellTestId, wellTestId))
      .orderBy(desc(iprAnalyses.analysisDate));
  }

  async listIprAnalysesByWell(wellId: string, tenantId: string): Promise<IprAnalysis[]> {
    return db
      .select({
        analysis: iprAnalyses,
        wellTest: wellTests,
      })
      .from(iprAnalyses)
      .innerJoin(wellTests, eq(iprAnalyses.wellTestId, wellTests.id))
      .where(and(eq(wellTests.wellId, wellId), eq(wellTests.tenantId, tenantId)))
      .orderBy(desc(iprAnalyses.analysisDate)) as any;
  }

  // ============================================================================
  // VLP ANALYSES
  // ============================================================================

  async createVlpAnalysis(data: NewVlpAnalysis): Promise<VlpAnalysis> {
    const [analysis] = await db.insert(vlpAnalyses).values(data).returning();
    return analysis;
  }

  async findVlpAnalysisById(id: string): Promise<VlpAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(vlpAnalyses)
      .where(eq(vlpAnalyses.id, id));
    return analysis;
  }

  async listVlpAnalysesByWellTest(wellTestId: string): Promise<VlpAnalysis[]> {
    return db
      .select()
      .from(vlpAnalyses)
      .where(eq(vlpAnalyses.wellTestId, wellTestId))
      .orderBy(desc(vlpAnalyses.analysisDate));
  }

  async listVlpAnalysesByWell(wellId: string): Promise<VlpAnalysis[]> {
    return db
      .select()
      .from(vlpAnalyses)
      .where(eq(vlpAnalyses.wellId, wellId))
      .orderBy(desc(vlpAnalyses.analysisDate));
  }

  // ============================================================================
  // NODAL ANALYSES
  // ============================================================================

  async createNodalAnalysis(data: NewNodalAnalysis): Promise<NodalAnalysis> {
    const [analysis] = await db.insert(nodalAnalyses).values(data).returning();
    return analysis;
  }

  async findNodalAnalysisById(id: string): Promise<NodalAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(nodalAnalyses)
      .where(eq(nodalAnalyses.id, id));
    return analysis;
  }

  async findNodalAnalysisWithRelations(id: string) {
    const [result] = await db
      .select({
        nodalAnalysis: nodalAnalyses,
        iprAnalysis: iprAnalyses,
        vlpAnalysis: vlpAnalyses,
        well: wells,
      })
      .from(nodalAnalyses)
      .leftJoin(iprAnalyses, eq(nodalAnalyses.iprAnalysisId, iprAnalyses.id))
      .leftJoin(vlpAnalyses, eq(nodalAnalyses.vlpAnalysisId, vlpAnalyses.id))
      .leftJoin(wells, eq(nodalAnalyses.wellId, wells.id))
      .where(eq(nodalAnalyses.id, id));
    
    return result;
  }

  async listNodalAnalysesByWell(wellId: string): Promise<NodalAnalysis[]> {
    return db
      .select()
      .from(nodalAnalyses)
      .where(eq(nodalAnalyses.wellId, wellId))
      .orderBy(desc(nodalAnalyses.analysisDate));
  }
}
