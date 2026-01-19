import { Body, Controller, Post, Req, Res, Get, UseGuards, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Response, Request } from 'express';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('initiate')
    async initiatePayment(@Body() body: InitiatePaymentDto) {
        const result = await this.paymentService.initiatePayment(body);
        // Normalize response for FE
        return {
            message: 'Payment initiated successfully',
            url: result?.GatewayPageURL || result?.redirectGatewayURL || null,
            gatewayResponse: result,
        };
    }

    @Post('success')
    async success(@Req() req: Request, @Res() res: Response) {
        const { tran_id, amount } = (req.body || {}) as any;
        if (tran_id) {
            await this.paymentService.markPaymentSuccess(tran_id, amount);
        }
        const url = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') +
          `/payment/success?tran_id=${encodeURIComponent(tran_id || '')}&amount=${encodeURIComponent(amount || '')}`;
        return res.redirect(url);
    }

    @Post('fail')
    async fail(@Req() req: Request, @Res() res: Response) {
        const { tran_id } = (req.body || {}) as any;
        if (tran_id) {
            await this.paymentService.markPaymentFailed(tran_id);
        }
        const url = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') +
          `/payment/fail?tran_id=${encodeURIComponent(tran_id || '')}`;
        return res.redirect(url);
    }

    @Post('cancel')
    async cancel(@Req() req: Request, @Res() res: Response) {
        const { tran_id } = (req.body || {}) as any;
        if (tran_id) {
            await this.paymentService.markPaymentCancelled(tran_id);
        }
        const url = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') +
          `/payment/cancel?tran_id=${encodeURIComponent(tran_id || '')}`;
        return res.redirect(url);
    }

    @Get('history')
    @UseGuards(AuthGuard)
    async getPaymentHistory(
        @Req() req: Request,
        @CursorPagination() pagination: PaginationParams,
        @Query('status') status?: string,
    ) {
        const userId = (req.user as any)?.userId || (req.user as any)?.id;
        return this.paymentService.getPaymentHistory(userId, pagination, status);
    }

}
