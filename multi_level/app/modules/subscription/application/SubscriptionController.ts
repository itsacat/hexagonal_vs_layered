class SubscriptionController extends Controller {
    public async actionSetAmount(actionContext) {
        const userId = actionContext.request.user.id;
        const projectId = actionContext.data.userFundId;
        const amount = actionContext.data.amount;
        const isCordova = !!actionContext.data.app;
        const paymentType = actionContext.data.type;

        const project: Project = await ProjectRepository.getById(projectId);
        const user: User = await UserRepository.getById(userId);


        const successRedirectURL: string =
            SberVmesteURL.makeSuccessRedirectUrl({isCordova, paymentType});

        const failureRedirectURL: string =
            SberVmesteURL.makeFailureRedirectUrl({isCordova, paymentType});

        let subscription: Subscription =
            await user.getSubscriptionByProject(project);

        try {
            if (subscription) {
                // ОБРАТИТЕВНИВАНИЕ: Отвратно, что метода subscribe и
                // restoreSubscription возвращают urlForFirstPayment
                // Но так не хочется записывать это временное поле в subscription
                // Не знаю как лучше.
                let urlForFirstPayment =
                    await user.restoreSubscription(
                        subscription, project, amount,
                        successRedirectURL, failureRedirectURL
                    );

            } else {
                    urlForFirstPayment = await user.subscribe(
                        project, amount, successRedirectURL, failureRedirectURL
                    );
            }
        } catch (error) {
            if (error instanceof CreationOfAcquiringOrderFailedError) {
                throw new errors.HttpError('Не удалось создать первый платёж', 400);
            } else if (error instanceof ProjectDisabledError) {
                throw new errors.HttpError('Проект не активен', 400);
            } else {
                throw error;
            }
        }

        if (urlForFirstPayment) {
            return {
                formUrl: urlForFirstPayment
            }
        }
    }
}
