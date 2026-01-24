import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentTransaction } from './schemas/payment-transaction.schema';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectModel(PaymentTransaction.name)
    private paymentTransactionModel: Model<PaymentTransaction>,
  ) {}

  async generateReceiptPDF(transactionId: string, res: Response) {
    const transaction = await this.paymentTransactionModel
      .findById(transactionId)
      .populate('vehicleId')
      .populate('userId', 'name email phone')
      .lean();

    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (transaction.status !== 'success') {
      throw new NotFoundException('Receipt only available for successful payments');
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${transaction._id}.pdf`,
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('NextRide', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Your Ride Awaits', 50, 78);

    // Invoice Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PAYMENT RECEIPT', 50, 120, { align: 'right' });

    // Receipt Details Box
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Receipt No: ${String(transaction._id).slice(-8).toUpperCase()}`, 50, 160)
      .text(`Date: ${new Date(transaction.completedAt || transaction.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 175)
      .text(`Status: ${transaction.status.toUpperCase()}`, 50, 190);

    // Horizontal line
    doc
      .strokeColor('#0ea5e9')
      .lineWidth(2)
      .moveTo(50, 210)
      .lineTo(550, 210)
      .stroke();

    // Customer Information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000')
      .text('Customer Information', 50, 230);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Name: ${transaction.cus_name || (transaction as any).userId?.name || 'N/A'}`, 50, 250)
      .text(`Email: ${transaction.cus_email || (transaction as any).userId?.email || 'N/A'}`, 50, 265)
      .text(`Phone: ${transaction.cus_phone || (transaction as any).userId?.phone || 'N/A'}`, 50, 280);

    // Payment Details
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Payment Details', 50, 320);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Transaction ID: ${transaction.tran_id}`, 50, 340)
      .text(`Payment Method: SSLCommerz`, 50, 355)
      .text(`Currency: ${transaction.currency}`, 50, 370);

    // Vehicle Information
    if (transaction.vehicleId) {
      const vehicle = transaction.vehicleId as any;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Vehicle Information', 50, 410);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Vehicle: ${vehicle.make} ${vehicle.modelName}`, 50, 430)
        .text(`Year: ${vehicle.year}`, 50, 445)
        .text(`Type: ${vehicle.vehicleType?.toUpperCase()}`, 50, 460);
    }

    // Amount Box
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .rect(50, 500, 500, 80)
      .stroke();

    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Platform Fee', 70, 520)
      .fontSize(10)
      .text('Payment for vehicle listing service', 70, 540);

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(transaction.amount);

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#0ea5e9')
      .text(`BDT ${formattedAmount}`, 350, 525, {
        align: 'right',
        width: 150,
      });

    // Footer
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .font('Helvetica')
      .text(
        'This is a computer-generated receipt and does not require a signature.',
        50,
        700,
        { align: 'center' },
      )
      .text(
        'For any queries, contact us at support@nextride.com',
        50,
        715,
        { align: 'center' },
      )
      .text('Thank you for choosing NextRide!', 50, 730, { align: 'center' });

    doc.end();
  }
}
