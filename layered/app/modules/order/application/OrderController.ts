class OrderController extends Controller {
    creationAcquiringOrderCallback(ctx) {
        let acquiringOrderNumber = ctx.request.query.orderNumber;
        let order = OrderRepository.getById(acquiringOrderNumber);

        if (!order) {
            // бросить ошибку
            return;
        } else if (order.type == orderTypes.RECURRENT) {
            // нужно описать зачем тут мы делаем return
            return;
        }

        if (order instanceof FirstOrder) {
            try {
                await(order.readAcquiringOrderData());
            } catch(error) {
                if (error instanceof OrderIsNotAvailableForPaymentError) {
                    // бросит ошибку
                }
            }
            OrderRepository.save(order);
        }

        return null;
    }
}
