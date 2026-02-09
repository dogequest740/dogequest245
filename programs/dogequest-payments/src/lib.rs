use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use solana_program::pubkey;

declare_id!("11111111111111111111111111111111");

pub const TREASURY_WALLET: Pubkey = pubkey!("9a5GXRjX6HKh9Yjc9d7gp9RFmuRvMQAcV1VJ9WV7LU8c");

#[program]
pub mod dogequest_payments {
    use super::*;

    pub fn buy_gold(ctx: Context<BuyGold>, pack_id: u8) -> Result<()> {
        require_keys_eq!(ctx.accounts.treasury.key(), TREASURY_WALLET, BuyGoldError::InvalidTreasury);

        let (gold, lamports) = match pack_id {
            0 => (50_000u64, 50_000_000u64),
            1 => (100_000u64, 100_000_000u64),
            2 => (500_000u64, 400_000_000u64),
            _ => return err!(BuyGoldError::InvalidPack),
        };

        let ix = system_instruction::transfer(&ctx.accounts.buyer.key(), &ctx.accounts.treasury.key(), lamports);
        invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(GoldPurchase {
            buyer: ctx.accounts.buyer.key(),
            pack_id,
            gold,
            lamports,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct BuyGold<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct GoldPurchase {
    pub buyer: Pubkey,
    pub pack_id: u8,
    pub gold: u64,
    pub lamports: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum BuyGoldError {
    #[msg("Invalid gold pack.")]
    InvalidPack,
    #[msg("Treasury wallet mismatch.")]
    InvalidTreasury,
}
