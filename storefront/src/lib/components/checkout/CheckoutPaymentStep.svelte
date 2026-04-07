<script lang="ts">
	type Props = {
		paymentMethod?: string;
		onBack: () => void;
		onNext: () => void;
	};

	let { paymentMethod = $bindable('manual'), onBack, onNext }: Props = $props();
</script>

<form
	class="payment-form"
	onsubmit={(e) => {
		e.preventDefault();
		onNext();
	}}
>
	<p class="payment-lead">Select a payment method. You won't be charged until you place your order.</p>
	<fieldset class="fieldset-payment">
		<legend class="visually-hidden">Payment method</legend>
		<label class="payment-method">
			<input type="radio" name="payment-method" value="manual" bind:group={paymentMethod} />
			<span class="payment-method-label">Manual Payment</span>
			<span class="payment-method-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="5" width="20" height="14" rx="2" />
					<line x1="2" y1="10" x2="22" y2="10" />
				</svg>
			</span>
		</label>
	</fieldset>
	<div class="payment-actions">
		<button type="button" class="back-btn" onclick={onBack}>Back</button>
		<button type="submit" class="next-btn">Next</button>
	</div>
</form>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.payment-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.payment-lead {
		font-size: 0.9375rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}
	.fieldset-payment {
		border: none;
		padding: 0;
		margin: 0;
	}
	.payment-method {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		border: 1px solid #1a1a1a;
		padding: 1rem 1.25rem;
		font-size: 0.9375rem;
		color: #1a1a1a;
		cursor: pointer;
	}
	.payment-method input {
		margin: 0;
		flex-shrink: 0;
	}
	.payment-method-label {
		flex: 1;
	}
	.payment-method-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #555;
		flex-shrink: 0;
	}
	.payment-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.back-btn {
		width: 100%;
		background: #fff;
		color: #2d2d2d;
		border: 1px solid #bdbdbd;
		padding: 1rem 1.5rem;
		margin-top: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: 0;
	}
	.back-btn:hover {
		border-color: #999;
		color: #1a1a1a;
	}
	.next-btn {
		width: 100%;
		background: #2d2d2d;
		color: #fff;
		border: none;
		padding: 1rem 1.5rem;
		margin-top: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 0;
	}
	.next-btn:hover {
		background: #1a1a1a;
	}
</style>
