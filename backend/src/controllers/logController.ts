import { Request, Response } from 'express';
import SystemLog from '../models/systemLogModel';
import logger from '../utils/logger';

export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      severity,
      search,
      startDate,
      endDate,
      userId
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Build search query
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { action: { $regex: search, $options: 'i' } },
          { details: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine filters
    const finalFilter = { ...filter, ...searchFilter };

    // Get logs with pagination
    const logs = await SystemLog.find(finalFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'firstName lastName email')
      .lean();

    // Get total count for pagination
    const total = await SystemLog.countDocuments(finalFilter);

    // Get statistics
    const stats = await SystemLog.aggregate([
      { $match: finalFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] }
          },
          warnings: {
            $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] }
          },
          authEvents: {
            $sum: { $cond: [{ $eq: ['$category', 'auth'] }, 1, 0] }
          }
        }
      }
    ]);

    const logStats = stats[0] || {
      total: 0,
      errors: 0,
      warnings: 0,
      authEvents: 0
    };

    // Log the admin action
    await logger.admin(
      'View System Logs',
      `Admin viewed system logs. Page: ${pageNum}, Filters: ${JSON.stringify(req.query)}`,
      req
    );

    res.json({
      logs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalLogs: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      },
      stats: logStats
    });

  } catch (error: any) {
    console.error('Error fetching system logs:', error);
    await logger.error(
      'Fetch System Logs Error',
      `Failed to fetch system logs: ${error.message}`,
      'admin',
      req
    );
    res.status(500).json({ message: 'Failed to fetch system logs' });
  }
};

export const getLogStats = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days as string);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const stats = await SystemLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            severity: '$severity',
            category: '$category'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          severities: {
            $push: {
              severity: '$_id.severity',
              count: '$count'
            }
          },
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(stats);

  } catch (error: any) {
    console.error('Error fetching log stats:', error);
    await logger.error(
      'Fetch Log Stats Error',
      `Failed to fetch log statistics: ${error.message}`,
      'admin',
      req
    );
    res.status(500).json({ message: 'Failed to fetch log statistics' });
  }
};

export const clearOldLogs = async (req: Request, res: Response) => {
  try {
    const { days = 90 } = req.query;
    const daysNum = parseInt(days as string);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const result = await SystemLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    await logger.admin(
      'Clear Old Logs',
      `Cleared ${result.deletedCount} logs older than ${daysNum} days`,
      req
    );

    res.json({
      message: `Successfully cleared ${result.deletedCount} old logs`,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('Error clearing old logs:', error);
    await logger.error(
      'Clear Old Logs Error',
      `Failed to clear old logs: ${error.message}`,
      'admin',
      req
    );
    res.status(500).json({ message: 'Failed to clear old logs' });
  }
};

export const exportLogs = async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    const logs = await SystemLog.find(filter)
      .sort({ timestamp: -1 })
      .populate('userId', 'firstName lastName email')
      .lean();

    await logger.admin(
      'Export Logs',
      `Exported ${logs.length} logs in ${format} format`,
      req
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Timestamp,Action,Category,Severity,Details,User,IP Address\n';
      const csvData = logs.map(log => {
        const user = log.userId
          ? `${(log.userId as any).firstName ?? ''} ${(log.userId as any).lastName ?? ''}`.trim() || log.userEmail || 'Anonymous'
          : log.userEmail || 'Anonymous';
        return `${log.timestamp},${log.action},${log.category},${log.severity},"${log.details}",${user},${log.ipAddress || ''}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=system-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvHeader + csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=system-logs-${new Date().toISOString().split('T')[0]}.json`);
      res.json(logs);
    }

  } catch (error: any) {
    console.error('Error exporting logs:', error);
    await logger.error(
      'Export Logs Error',
      `Failed to export logs: ${error.message}`,
      'admin',
      req
    );
    res.status(500).json({ message: 'Failed to export logs' });
  }
}; 