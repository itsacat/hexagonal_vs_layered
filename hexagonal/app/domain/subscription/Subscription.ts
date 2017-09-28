class Subscription {
    public enable() {
        // Странно что включение подписки бросает событие UserSubscribed.
        // Особенно учитывая что подписка может выключаться/включаться из админки.
        // Возможно стоит сделать 2 статуса: enabled и activated.
        if (!this.enabled) {
            this.enabled = true;
            this.setPayDate(new Date());
            // Бросается событие UserSubscribed
        }
    }
}
