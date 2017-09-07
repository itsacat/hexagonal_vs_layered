// Лучше его назвать ActivatingPayment, или что-то подобное.
class FirstOrder {
    // @melfimov Странно что возвращается redirect url как результат операции. Это скорее нужно хранить
    // во временном поле order, и получать в контроллере, или хранить в БД чтобы можно было позже вернуться
    // к процессу оплаты если пользователь вдруг окно случайно закрыл

    public async makePaymentInAcquiring(
            successRedirectURL, failureRedirectURL
        ) {
        let urlForPaymentOfAcquiringOrder = await this.createAcquiringOrder_(
            successRedirectURL, failureRedirectURL
        );

        return urlForPaymentOfAcquiringOrder;
    }


    // @melfimov в целом обращение к сервису здесь ok, но, возможно, я бы вынес логику общения с платёжным
    // шлюзом в объект acquiringOrder
    private async createAcquiringOrder_(successRedirectURL, failureRedirectURL) {
        const acquiringResponse = await SberAcquiringDataService.createOrder({
            orderNumber: this.id,
            clientId: this.userId,
            amount: this.amount,
            returnUrl: successRedirectURL,
            failUrl: failureRedirectURL
        });

        if (acquiringResponse.errorCode) {
            this.acquiringOrder.acquiringErrorCode =
                acquiringResponse.errorCode;
            this.acquiringOrder.acquiringErrorMessage =
                acquiringResponse.errorMessage;

            this.setStatus(
                FirstOrderStatus.CREATION_OF_ACQUIRING_ORDER_FAILED
            );

            // ОБРАТИТЕВНИВАНИЕ: правильно ли тут сохранять? Вроде нет.
            // Но тогда надо не забыть поймать ошибку выше в makeFirstOrder_ и сохранить.
            await OrderRepository.save(this);
            throw new CreationOfAcquiringOrderFailedError();
        }

        this.acquiringOrder.id = acquiringResponse.orderId;
        this.setStatus(FirstOrderStatus.WAITING_FOR_ACQUIRING_ORDER_DATA);

        let urlForPaymentOfAcquiringOrder = acquiringResponse.formUrl;

        return urlForPaymentOfAcquiringOrder;

        // ОБРАТИТЕВНИВАНИЕ: Обратить внимание на 2 вопроса:
        // Тут теряется ход мыслей.
        // Как прокидываются successRedirectURL, failureRedirectURL, urlForPaymentOfAcquiringOrder
    }


    public readAcquiringOrderData() {
        if (!this.isAvailableForPayment) {
            throw OrderIsNotAvailableForPaymentError();
        }

        let acquiringResponse = aqService.getStatusAndGetBind(this);


        if (acquiringResponse.errorCode) {
            this.acquiringOrder.errorCode = acquiringResponse.errorCode;
            this.acquiringOrder.errorMessage = acquiringResponse.errorMessage;

            this.setStatus(FirstOrderStatus.FAILED);
        } else {
            this.acquiringOrder.id = acquiringResponse.orderId;
            this.acquiringOrder.actionCode = acquiringResponse.actionCode;
            this.acquiringOrder.actionCodeDescription =
                acquiringResponse.actionCodeDescription;

            this.setStatus(FirstOrderStatus.PAID);

            //нужно сделать нормальное событие
            dispatchEvent('FirstOrderPaid', this);
        }
    }
}
