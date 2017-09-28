class SubscriptionController extends Controller {
    public async setAmountAndSubscribeOrRestoreSubscription(actionContext) {
        const userId = actionContext.request.user.id;
        const projectId = actionContext.data.userFundId;
        const amount = actionContext.data.amount;
        const isCordova = !!actionContext.data.app;
        const paymentType = actionContext.data.type;


        SetAmount.setAmount(userId, projectId, amount);


        const successRedirectURL: string =
            SberVmesteURL.makeSuccessRedirectUrl({isCordova, paymentType});

        const failureRedirectURL: string =
            SberVmesteURL.makeFailureRedirectUrl({isCordova, paymentType});

        let urlForPaymentInAcquiring = null;

        try {
            let subscription = await SubscribeOnProject.subscribeOrRestoreSubscription(
                userId, projectId, amount, successRedirectURL, failureRedirectURL
            );
            urlForPaymentInAcquiring = subscription.urlForPaymentInAcquiring;
        } catch (error) {
            if (error instanceof CreationOfAcquiringOrderFailedError) {
                throw new errors.HttpError('Не удалось создать первый платёж', 400);
            } else if (error instanceof ProjectDisabledError) {
                throw new errors.HttpError('Проект не активен', 400);
            } else {
                throw error;
            }
        }

        if (urlForPaymentInAcquiring) {
            return {
                formUrl: urlForPaymentInAcquiring
            }
        }
    }
}
