/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/apyx.json`.
 */
export type Apyx = {
  "address": "APYzSaPqLXC9HJeMLwbMpgbFN5VJD8iLyZjSAZdvcZGM",
  "metadata": {
    "name": "apyx",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyExactSolIn",
      "discriminator": [
        56,
        252,
        116,
        8,
        158,
        223,
        205,
        95
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "bondingCurve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "associatedBondingCurve",
          "writable": true
        },
        {
          "name": "associatedUser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "creatorVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bondingCurve"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "protocolFeeVault",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "duel",
          "writable": true
        },
        {
          "name": "lastDuel",
          "docs": [
            "Optional last duel account for verification when PDAs don't match.",
            "Pass this account if the token has a pending duel that doesn't match the expected duel PDA.",
            "If bonding curve has a last_duel and this account is not passed, the transaction will fail."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "spendableSolIn",
          "type": "u64"
        },
        {
          "name": "minTokensOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimCreatorRewards",
      "discriminator": [
        14,
        215,
        177,
        181,
        221,
        193,
        125,
        85
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Creator of the bonding curve (must match bonding_curve.creator). Receives the SOL."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "bondingCurve",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "creatorVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bondingCurve"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token-2022 program (required for mint interface validation)."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimMercy",
      "discriminator": [
        124,
        17,
        216,
        11,
        201,
        49,
        68,
        203
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Signer: either the beneficiary (self-claim) or config.delegated_claim_authority (delegated claim)."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "beneficiary",
          "docs": [
            "Beneficiary: wallet whose loser balance is used and who receives winner tokens. Must equal authority (self-claim) or authority must be config.delegated_claim_authority."
          ]
        },
        {
          "name": "winnerMint"
        },
        {
          "name": "loserMint"
        },
        {
          "name": "bondingCurveLoser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "loserMint"
              }
            ]
          }
        },
        {
          "name": "duel"
        },
        {
          "name": "mercyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  114,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bondingCurveLoser"
              },
              {
                "kind": "account",
                "path": "duel"
              }
            ]
          }
        },
        {
          "name": "associatedBondingCurveLoser",
          "docs": [
            "Bonding curve's ATA for loser mint (no longer receives loser tokens on claim; loser tokens stay with user)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bondingCurveLoser"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "loserMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userLoserAta",
          "docs": [
            "Beneficiary's loser token ATA (balance used for share calculation; we do not transfer these)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "beneficiary"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "loserMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userTokenAccount",
          "docs": [
            "Where to send winner tokens (beneficiary's ATA for winner_mint)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "beneficiary"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "winnerMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "configInit",
      "discriminator": [
        13,
        236,
        164,
        173,
        106,
        253,
        164,
        185
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "protocolFeeBps",
          "type": "u16"
        },
        {
          "name": "creatorFeeBps",
          "type": "u16"
        },
        {
          "name": "protocolFeeVault",
          "type": "pubkey"
        },
        {
          "name": "targetMcapGrowthBps",
          "type": "u16"
        },
        {
          "name": "graduateTokens",
          "type": "bool"
        },
        {
          "name": "graduationFeeLamports",
          "type": "u64"
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64"
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u128"
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u128"
        },
        {
          "name": "totalSupply",
          "type": "u128"
        },
        {
          "name": "windowSizeSlots",
          "type": "u64"
        },
        {
          "name": "matchKeySpace",
          "type": "u16"
        },
        {
          "name": "cooldownSlots",
          "type": "u64"
        },
        {
          "name": "delegatedClaimAuthority",
          "type": "pubkey"
        },
        {
          "name": "delegatedResolveAuthority",
          "type": "pubkey"
        },
        {
          "name": "mercyDiscountMultiplierBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "configUpdate",
      "discriminator": [
        80,
        37,
        109,
        136,
        82,
        135,
        89,
        241
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        },
        {
          "name": "protocolFeeBps",
          "type": "u16"
        },
        {
          "name": "creatorFeeBps",
          "type": "u16"
        },
        {
          "name": "protocolFeeVault",
          "type": "pubkey"
        },
        {
          "name": "targetMcapGrowthBps",
          "type": "u16"
        },
        {
          "name": "graduateTokens",
          "type": "bool"
        },
        {
          "name": "graduationFeeLamports",
          "type": "u64"
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64"
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u128"
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u128"
        },
        {
          "name": "totalSupply",
          "type": "u128"
        },
        {
          "name": "windowSizeSlots",
          "type": "u64"
        },
        {
          "name": "matchKeySpace",
          "type": "u16"
        },
        {
          "name": "cooldownSlots",
          "type": "u64"
        },
        {
          "name": "delegatedClaimAuthority",
          "type": "pubkey"
        },
        {
          "name": "delegatedResolveAuthority",
          "type": "pubkey"
        },
        {
          "name": "mercyDiscountMultiplierBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "forceDuelIdl",
      "discriminator": [
        162,
        190,
        36,
        164,
        37,
        121,
        222,
        179
      ],
      "accounts": [
        {
          "name": "duel"
        }
      ],
      "args": []
    },
    {
      "name": "launchToken",
      "discriminator": [
        10,
        128,
        86,
        171,
        3,
        137,
        161,
        244
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "Mint account (signer, created by client)",
            "We can't use extension constraints here because Anchor checks them before the account exists"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "bondingCurve",
          "docs": [
            "Bonding curve PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "associatedBondingCurve",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "token2022Program",
          "docs": [
            "Token-2022 program (used for both ATA creation and CPI calls)",
            "Token-2022 program ID: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
          ]
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "creator",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "migrate",
      "discriminator": [
        155,
        234,
        231,
        146,
        236,
        158,
        162,
        30
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Must match config.delegated_resolve_authority. Receives quote SOL for off-chain pool creation."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "bondingCurve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "associatedBondingCurve",
          "docs": [
            "Curve's token ATA; its full balance becomes base_amount_in for pool creation."
          ],
          "writable": true
        },
        {
          "name": "associatedAuthorityBase",
          "docs": [
            "Authority's base ATA; receives base tokens from curve ATA."
          ],
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "protocolFeeVault",
          "writable": true
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "resolveDuel",
      "discriminator": [
        213,
        162,
        203,
        235,
        151,
        236,
        178,
        64
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "winnerMint"
        },
        {
          "name": "loserMint",
          "writable": true
        },
        {
          "name": "bondingCurveWinner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "winnerMint"
              }
            ]
          }
        },
        {
          "name": "bondingCurveLoser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "loserMint"
              }
            ]
          }
        },
        {
          "name": "duel",
          "writable": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "protocolFeeVault",
          "writable": true
        },
        {
          "name": "associatedBondingCurveWinner",
          "writable": true
        },
        {
          "name": "associatedBondingCurveLoser",
          "writable": true
        },
        {
          "name": "mercyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  114,
                  99,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bondingCurveLoser"
              },
              {
                "kind": "account",
                "path": "duel"
              }
            ]
          }
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "sellExactTokensIn",
      "discriminator": [
        120,
        36,
        47,
        48,
        162,
        83,
        155,
        168
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "bondingCurve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "associatedBondingCurve",
          "writable": true
        },
        {
          "name": "associatedUser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  121,
                  120,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "duel",
          "writable": true
        },
        {
          "name": "lastDuel",
          "docs": [
            "Pass this account if the token has a pending duel that doesn't match the expected duel PDA.",
            "If bonding curve has a last_duel and this account is not passed, the transaction will fail."
          ],
          "writable": true,
          "optional": true
        }
      ],
      "args": [
        {
          "name": "tokensIn",
          "type": "u64"
        },
        {
          "name": "minSolOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "toggleAutoClaim",
      "discriminator": [
        44,
        64,
        204,
        46,
        239,
        114,
        158,
        68
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "userSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "bondingCurveAccount",
      "discriminator": [
        143,
        100,
        193,
        40,
        52,
        254,
        111,
        103
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "duel",
      "discriminator": [
        126,
        229,
        210,
        60,
        177,
        135,
        124,
        224
      ]
    },
    {
      "name": "userSettings",
      "discriminator": [
        147,
        229,
        120,
        56,
        158,
        86,
        77,
        209
      ]
    }
  ],
  "events": [
    {
      "name": "claimMercyEvent",
      "discriminator": [
        172,
        51,
        174,
        135,
        156,
        240,
        198,
        243
      ]
    },
    {
      "name": "duelCreatedEvent",
      "discriminator": [
        223,
        175,
        56,
        84,
        72,
        69,
        138,
        58
      ]
    },
    {
      "name": "duelMatchedEvent",
      "discriminator": [
        58,
        162,
        252,
        19,
        82,
        83,
        123,
        182
      ]
    },
    {
      "name": "duelPairingFailedEvent",
      "discriminator": [
        49,
        228,
        61,
        92,
        104,
        191,
        192,
        163
      ]
    },
    {
      "name": "duelResolvedEvent",
      "discriminator": [
        178,
        70,
        126,
        92,
        221,
        170,
        241,
        48
      ]
    },
    {
      "name": "launchTokenEvent",
      "discriminator": [
        91,
        126,
        236,
        51,
        80,
        121,
        176,
        197
      ]
    },
    {
      "name": "tokenGraduatedEvent",
      "discriminator": [
        73,
        116,
        111,
        26,
        92,
        217,
        146,
        141
      ]
    },
    {
      "name": "tradeEvent",
      "discriminator": [
        189,
        219,
        127,
        211,
        78,
        230,
        97,
        238
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6001,
      "name": "amountOverflow",
      "msg": "Amount overflow"
    },
    {
      "code": 6002,
      "name": "invalidPoolConfig",
      "msg": "Invalid pool configuration"
    },
    {
      "code": 6003,
      "name": "invalidContestStatus",
      "msg": "Contest not in correct status"
    },
    {
      "code": 6004,
      "name": "contestAlreadyResolved",
      "msg": "Contest already resolved"
    },
    {
      "code": 6005,
      "name": "targetNotReached",
      "msg": "Target metric not reached"
    },
    {
      "code": 6006,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6007,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity"
    },
    {
      "code": 6008,
      "name": "invalidFeeParams",
      "msg": "Invalid fee parameters"
    },
    {
      "code": 6009,
      "name": "randomnessNotAvailable",
      "msg": "Randomness not available"
    },
    {
      "code": 6010,
      "name": "invalidTimestamp",
      "msg": "Invalid timestamp"
    },
    {
      "code": 6011,
      "name": "invalidUserPosition",
      "msg": "Invalid user position"
    },
    {
      "code": 6012,
      "name": "poolHasActiveContest",
      "msg": "Pool has active contest"
    },
    {
      "code": 6013,
      "name": "feeVaultMismatch",
      "msg": "Fee vault mismatch"
    },
    {
      "code": 6014,
      "name": "poolDevourableMismatch",
      "msg": "Pool devourable mismatch"
    },
    {
      "code": 6015,
      "name": "emptyPool",
      "msg": "Pool is empty"
    },
    {
      "code": 6016,
      "name": "userHasNoPosition",
      "msg": "User has no position"
    },
    {
      "code": 6017,
      "name": "zeroPoolSol",
      "msg": "Zero pool sol"
    },
    {
      "code": 6018,
      "name": "missingAccount",
      "msg": "Account expected in remaining accounts is missing"
    },
    {
      "code": 6019,
      "name": "metaPairPoolMismatch",
      "msg": "Meta pair pool mismatch"
    },
    {
      "code": 6020,
      "name": "insufficientLpSupply",
      "msg": "Insufficient LP supply"
    },
    {
      "code": 6021,
      "name": "insufficientLpToMint",
      "msg": "Insufficient LP to mint"
    },
    {
      "code": 6022,
      "name": "insufficientLpBalance",
      "msg": "Insufficient LP balance"
    },
    {
      "code": 6023,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6024,
      "name": "insufficientAmountOut",
      "msg": "Insufficient amount out"
    },
    {
      "code": 6025,
      "name": "bondingCurveComplete",
      "msg": "Bonding curve is complete"
    },
    {
      "code": 6026,
      "name": "insufficientTokensOut",
      "msg": "Insufficient tokens out"
    },
    {
      "code": 6027,
      "name": "insufficientSolOut",
      "msg": "Insufficient SOL out"
    },
    {
      "code": 6028,
      "name": "invalidReserves",
      "msg": "Invalid reserves"
    },
    {
      "code": 6029,
      "name": "invalidAssociatedBondingCurve",
      "msg": "Invalid associated bonding curve"
    },
    {
      "code": 6030,
      "name": "tokenAlreadyInDuel",
      "msg": "Token is already in an active duel"
    },
    {
      "code": 6031,
      "name": "tokenInCooldown",
      "msg": "Token is in cooldown period"
    },
    {
      "code": 6032,
      "name": "duelAlreadyFull",
      "msg": "Duel is already full"
    },
    {
      "code": 6033,
      "name": "selfDuel",
      "msg": "Cannot duel with self"
    },
    {
      "code": 6034,
      "name": "marketCapTooLow",
      "msg": "Market cap too low for duels"
    },
    {
      "code": 6035,
      "name": "marketCapTooHigh",
      "msg": "Market cap too high for duels"
    },
    {
      "code": 6036,
      "name": "invalidDuelAccount",
      "msg": "Invalid duel account"
    },
    {
      "code": 6037,
      "name": "lastDuelAccountRequired",
      "msg": "Last duel account required for verification - please include bonding curve's last_duel account"
    },
    {
      "code": 6038,
      "name": "unauthorizedClaimer",
      "msg": "Unauthorized claimer: must be position owner or delegated worker with auto-claim enabled"
    },
    {
      "code": 6039,
      "name": "insufficientSolForGraduationFee",
      "msg": "Insufficient SOL on bonding curve for graduation fee"
    },
    {
      "code": 6040,
      "name": "insufficientCurveLamportsForPool",
      "msg": "Insufficient lamports on bonding curve for pool transfer (curve must retain rent-exempt minimum)"
    },
    {
      "code": 6041,
      "name": "invalidGraduationEscrow",
      "msg": "Invalid graduation escrow PDA"
    },
    {
      "code": 6042,
      "name": "creatorVaultEmpty",
      "msg": "Creator vault has no SOL to claim"
    },
    {
      "code": 6043,
      "name": "invalidCreatorVault",
      "msg": "Invalid creator vault (must be program-owned PDA)"
    }
  ],
  "types": [
    {
      "name": "bondingCurveAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "virtualSolReserves",
            "type": "u64"
          },
          {
            "name": "virtualTokenReserves",
            "type": "u128"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u128"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u128"
          },
          {
            "name": "roundWins",
            "type": "u64"
          },
          {
            "name": "complete",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lastDuel",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "duelStatus",
            "type": {
              "option": {
                "defined": {
                  "name": "roundStatus"
                }
              }
            }
          },
          {
            "name": "lastDuelSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "claimMercyEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "duel",
            "type": "pubkey"
          },
          {
            "name": "bondingCurveLoser",
            "type": "pubkey"
          },
          {
            "name": "claimAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "protocolFeeVault",
            "type": "pubkey"
          },
          {
            "name": "protocolFeeBps",
            "type": "u16"
          },
          {
            "name": "creatorFeeBps",
            "type": "u16"
          },
          {
            "name": "targetMcapGrowthBps",
            "docs": [
              "Target mcap growth in bps (e.g. 11000 = 110%). Used when matching duels."
            ],
            "type": "u16"
          },
          {
            "name": "graduateTokens",
            "docs": [
              "When true, allow migrate when real_token_reserves == 0 (off-chain service creates PumpSwap pool)."
            ],
            "type": "bool"
          },
          {
            "name": "graduationFeeLamports",
            "docs": [
              "Graduation fee in lamports sent to protocol_fee_vault (e.g. 6 SOL = 6_000_000_000)."
            ],
            "type": "u64"
          },
          {
            "name": "initialVirtualSolReserves",
            "type": "u64"
          },
          {
            "name": "initialVirtualTokenReserves",
            "type": "u128"
          },
          {
            "name": "initialRealTokenReserves",
            "type": "u128"
          },
          {
            "name": "totalSupply",
            "type": "u128"
          },
          {
            "name": "windowSizeSlots",
            "type": "u64"
          },
          {
            "name": "matchKeySpace",
            "type": "u16"
          },
          {
            "name": "cooldownSlots",
            "type": "u64"
          },
          {
            "name": "delegatedClaimAuthority",
            "docs": [
              "Apyx system wallet; used for delegated auto-claim and validated in claim_mercy."
            ],
            "type": "pubkey"
          },
          {
            "name": "delegatedResolveAuthority",
            "docs": [
              "Authority that may call resolve_duel and migrate (post-trade logic service)."
            ],
            "type": "pubkey"
          },
          {
            "name": "mercyDiscountMultiplierBps",
            "docs": [
              "Mercy discount: multiplier in bps (e.g. 10000 = 1.0, 11000 = 1.1). Winner tokens sent to mercy vault = base_tokens * mercy_discount_multiplier_bps / 10000, capped by real_token_reserves."
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "duel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintA",
            "type": "pubkey"
          },
          {
            "name": "mintB",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bucket",
            "type": "u8"
          },
          {
            "name": "window",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "targetMcap",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "roundStatus"
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "loserTokenCirculatingSnapshot",
            "docs": [
              "Loser token circulating supply at resolution (supply - curve ATA balance); set in resolve_duel for token-based claim_mercy."
            ],
            "type": "u64"
          },
          {
            "name": "tokenAMcapAtStart",
            "docs": [
              "Token A market cap (lamports) at duel creation; used for progress 0% baseline."
            ],
            "type": "u64"
          },
          {
            "name": "tokenBMcapAtStart",
            "docs": [
              "Token B market cap (lamports) at duel join; used for progress 0% baseline."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "duelCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duel",
            "type": "pubkey"
          },
          {
            "name": "mintA",
            "type": "pubkey"
          },
          {
            "name": "bucket",
            "type": "u8"
          },
          {
            "name": "window",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "duelMatchedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duel",
            "type": "pubkey"
          },
          {
            "name": "mintA",
            "type": "pubkey"
          },
          {
            "name": "mintB",
            "type": "pubkey"
          },
          {
            "name": "bucket",
            "type": "u8"
          },
          {
            "name": "window",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "duelPairingFailedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duel",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "mintA",
            "type": "pubkey"
          },
          {
            "name": "mintB",
            "type": "pubkey"
          },
          {
            "name": "bucket",
            "type": "u8"
          },
          {
            "name": "window",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "duelResolvedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duel",
            "type": "pubkey"
          },
          {
            "name": "winnerMint",
            "type": "pubkey"
          },
          {
            "name": "loserMint",
            "type": "pubkey"
          },
          {
            "name": "targetMcap",
            "type": "u64"
          },
          {
            "name": "solUsed",
            "type": "u64"
          },
          {
            "name": "winnerTokensBought",
            "type": "u64"
          },
          {
            "name": "protocolFee",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "launchTokenEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "bondingCurve",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "roundStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "tokenGraduatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "docs": [
              "PumpSwap pool (default during migrate; pool is created off-chain in the next instruction)."
            ],
            "type": "pubkey"
          },
          {
            "name": "graduationFeeLamports",
            "type": "u64"
          },
          {
            "name": "realSolReservesAtGraduation",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tradeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "solAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "isBuy",
            "type": "bool"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "virtualSolReserves",
            "type": "u64"
          },
          {
            "name": "virtualTokenReserves",
            "type": "u128"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u128"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "feeBasisPoints",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "creatorFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "creatorFee",
            "type": "u64"
          },
          {
            "name": "ixName",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "userSettings",
      "docs": [
        "Per-wallet user settings (PDA seeds: [b\"user\", wallet])."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "autoClaimMercy",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
