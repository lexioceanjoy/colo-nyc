# Place ID resolution review (2026-10-27)

Google text is never stored. Columns: our slug · our address · chosen place ID · name similarity · borough match · street-number match · decision.

| slug | our address | place ID | sim | borough | street | decision |
|---|---|---|---|---|---|---|
| citigroup-center-atrium | 153 E 53rd St, New York, NY 10022 | — | 0.00 | ✓ | ✗ | unresolved: best candidate too weak (sim 0.00, borough true, street false) |
| dream-midtown-the-rickey | 210 W 55th St, New York, NY 10019 | ChIJxbdMGfhYwokRspYBtV5T7qY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| greenpoint-library | 107 Norman Ave, Brooklyn, NY 11222 | — | 0.25 | ✓ | ✓ | unresolved: best candidate too weak (sim 0.25, borough true, street true) |
| nypl-schwarzman-rose-main-reading-room | 476 Fifth Ave, New York, NY 10018 | ChIJqaiomQBZwokRTHOaUG7fUTs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |

## Pass 1 (121 resolved)
| slug | our address | place ID | sim | borough | street | decision |
|---|---|---|---|---|---|---|
| 1-hotel-brooklyn-bridge | 60 Furman Street, Brooklyn, NY 11201 | ChIJI3iV7jlawokRGIVhEkj651U | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| 11-howard-soho | 11 Howard St, New York, NY 10013 | ChIJb4dH84lZwokRhse_aRud9Vk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| 125th-street-library | 224 E 125th St, New York, NY | ChIJ57Wj8eH1wokR89mX9lOqtzM | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| 180-maiden-lane-atrium | 180 Maiden Lane, New York, NY 10038 | ChIJHRZ3w0JbwokRPONFSI1KWBs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| 550-madison-garden | 550 Madison Ave, New York, NY 10022 | ChIJ0RNX-_pYwokRSwJeJLDCmJg | 0.67 | ✓ | ✓ | picked: moderate name similarity, borough and street number match |
| 590-madison-atrium | 590 Madison Ave, New York, NY 10022 | ChIJFdFh93lZwokR2hGl7tNaYJ0 | 0.75 | ✓ | ✓ | auto: high name similarity + borough match |
| 787-coffee-west-village | 204 W 10th St, New York, NY | ChIJRWo8v4RZwokRbggnxWmoWpA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| 875-third-avenue-atrium | 875 Third Ave, New York, NY 10022 | ChIJbcUeIABZwokR-KJ-g03ekrA | 0.75 | ✓ | ✓ | auto: high name similarity + borough match |
| absolute-coffee-boerum-hill | 327 Atlantic Ave, Brooklyn, NY 11201 | ChIJrahUxk1awokRVdW3wqA3PSk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| ace-hotel-brooklyn | 252 Schermerhorn St, Brooklyn, NY 11217 | ChIJp-gHME1awokRD04lzhd8DQU | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| ace-hotel-new-york | 20 W 29th St, New York, NY 10001 | ChIJT2h1HKZZwokR_Nwoxn8RfU0 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| amano-cafe-greenwich-village | 172 W 4th St, New York, NY 10014 | ChIJQeNfnQ9ZwokRl84N7A2loNs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| arlo-nomad | 11 E 31st St, New York, NY 10016 | ChIJVTHBbqhZwokR57PGOxTXH08 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| arlo-soho-hudson-square | 231 Hudson St, New York, NY 10013 | ChIJVTHBbqhZwokRl4ESqCTeHSQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| avabrew-downtown-brooklyn | 100 Willoughby St, Brooklyn, NY 11201 | ChIJczWiaUtawokRpho6CaLXD4I | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| barnes-and-noble-union-square | 33 E 17th St, New York, NY 10003 | ChIJU3ex96JZwokR-Fxpjm58XVg | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| bedford-library | 496 Franklin Ave, Brooklyn, NY 11238 | ChIJvZCT05lbwokRev7_Nua8_mk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| bianco-latte-williamsburg | 109 Bedford Ave, Brooklyn, NY | ChIJdW0qy0BZwokRo5zf02DJYuY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| bibliotheque-soho | 54 Mercer St, New York, NY 10013 | ChIJvTUD4LZZwokRPYqxLi7y9Kg | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| birdee-williamsburg | 300 Kent Ave, Brooklyn, NY 11249 | ChIJJbmnn01ZwokRRBmMCKIY8K8 | 1.00 | ✓ | ✗ | auto: high name similarity + borough match |
| black-cat-les | 172 Rivington St, New York, NY 10002 | ChIJjW5AuIFZwokRdNPH7jFGigM | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| book-club-bar-east-village | 197 E 3rd St, New York, NY 10009 | ChIJwxHj5iBZwokR_pY9e5OhHNs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| boro-hotel-long-island-city | 38-28 27th Street, Long Island City, NY 11101 | ChIJU197tSxfwokRmYGxzgn8yyo | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| broadway-library-astoria | 40-20 Broadway, Astoria, NY 11103 | ChIJK_dVhjtfwokRguid1HxByj4 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| brooklyn-heights-library | 286 Cadman Plaza West, Brooklyn, NY 11201 | ChIJvVo5tklawokRE4NX60RebFs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| brooklyn-public-library-central | 10 Grand Army Plaza, Brooklyn, NY 11238 | ChIJzYGq1AlbwokR5rnEbWm1UxA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| brooklyn-roasting-company-flushing-ave | 200 Flushing Ave, Brooklyn, NY 11205 | ChIJq-1pjMZbwokRDCaS0SzzmCU | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| cafe-flor-chelsea | 218 8th Ave, New York, NY 10011 | ChIJ_abIqHtZwokRLWbw0G-lzu8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| cafe-miguel-williamsburg | 636 Grand Street, Brooklyn, NY 11211 | ChIJ9zV5YWtZwokRid2oSHl0Uk4 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| capital-one-cafe-59th-lexington | 731 Lexington Ave, New York, NY 10022 | ChIJV5rmlrhZwokR9SSmZ0-tEis | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| capital-one-cafe-columbus-circle | 1843 Broadway, New York, NY 10023 | ChIJeyuJWgBZwokRPMC43YuR4iY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| capital-one-cafe-union-square | 853 Broadway, New York, NY 10003 | ChIJiZNr8JhZwokRqo_36CN_Etk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| center-for-fiction-fort-greene | 15 Lafayette Ave, Brooklyn, NY 11217 | ChIJgf_deP5YwokR9lClGH8WEZQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| citigroup-center-atrium | 153 E 53rd St, New York, NY 10022 | — | 0.00 | ✓ | ✗ | unresolved: best candidate too weak (sim 0.00, borough true, street false) |
| citizenm-times-square | 218 W 50th St, New York, NY | ChIJD7NlQVZYwokRUIDluhjtu94 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| conwell-coffee-hall-fidi | 6 Hanover St, New York, NY 10005 | ChIJgTMBOPtbwokR1Y0sSidhvqI | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| coppola-cafe-west-village | 171 W 4th St, New York, NY 10014 | ChIJURYbNaZZwokRmn6eJrWBk8U | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| david-rubenstein-atrium-lincoln-center | 1887 Broadway, New York, NY 10023 | ChIJDyq28vVYwokRuzPLGeJGAC0 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| devocion-downtown-brooklyn | 276 Livingston St, Brooklyn, NY 11201 | ChIJ99H-1bJbwokRU52Z-5Y-BDI | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| devocion-flatiron | 25 E 20th St, New York, NY 10003 | ChIJH1KZKilZwokRYwSxtHI3_N0 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| devocion-williamsburg | 69 Grand St, Brooklyn, NY 11249 | ChIJi7flemFZwokRDpIJuxfOGek | 1.00 | ✓ | ✗ | auto: high name similarity + borough match |
| dots-cafe-hells-kitchen | 515 W 52nd St, New York, NY 10019 | ChIJ4U6rJ9VZwokRyix47QYqOCU | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| dream-midtown-the-rickey | 210 W 55th St, New York, NY 10019 | — | 0.00 | ✓ | ✓ | unresolved: best candidate too weak (sim 0.00, borough true, street true) |
| dweebs-bushwick | 1434 DeKalb Ave, Brooklyn, NY 11237 | ChIJ8bs_FhtcwokR9bhn1_XbLxI | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| fontainhas-dumbo | 28 Jay St, Brooklyn, NY 11201 | ChIJT8edfwBbwokRTEMjS7mKyno | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| greats-of-craft-lic | 10-15 43rd Ave, Long Island City, NY 11101 | ChIJL0xJb_ZZwokRfmKufMDAycE | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| greenpoint-library | 107 Norman Ave, Brooklyn, NY 11222 | — | 0.25 | ✓ | ✓ | unresolved: best candidate too weak (sim 0.25, borough true, street true) |
| ground-central-hells-kitchen | 888 8th Ave, New York, NY 10019 | ChIJ1X3dvldYwokRyajPtakhQLk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| ground-support-soho | 399 W Broadway, New York, NY 10012 | ChIJIXmQFYxZwokRhxGPUQv0TRk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| hex-and-co-morningside-heights | 2911 Broadway (at W 114th St), New York, NY | ChIJQ_9CkDv2wokR4luLdCr0Jo8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| high-line-hotel-chelsea | 180 Tenth Ave, New York, NY 10011 | ChIJ-1XDX7hZwokRHLjn63mDetU | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| housing-works-bookstore-cafe-soho | 126 Crosby St, New York, NY | ChIJSaRjC49ZwokR402Rpxj6i9Q | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| hudson-park-library | 66 Leroy St, New York, NY 10014 | ChIJ59bqwJJZwokRPO92t_8P3vQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| hungarian-pastry-shop | 1030 Amsterdam Ave, New York, NY 10025 | ChIJJ08I7Tz2wokRe5Z0jqyF3F0 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| hunters-point-library-lic | 47-40 Center Blvd, Long Island City, NY 11109 | ChIJHU9ln5lZwokRHTcHvwnZPjc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| icp-cafe-lower-east-side | 84 Ludlow Street, New York, NY 10002 | ChIJk4Q6TR9ZwokRBVc8MeOYnUA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| industry-city-sunset-park | 220 36th St, Brooklyn, NY 11232 | ChIJBzJseMBawokRVfGOLobHpJc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| inwood-library | 4790 Broadway, New York, NY 10034 | ChIJLdsbEvjzwokRVPFkG4NxcM4 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| irving-farm-washington-square | 78 W 3rd St, New York, NY 10012 | ChIJAc9Po5FZwokRXjgXoZ4y38I | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| jefferson-market-library | 425 Avenue of the Americas, New York, NY 10011 | ChIJicyj7JZZwokRagn5wfATxZ8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| kimpton-hotel-eventi | 851 6th Ave, New York, NY 10001 | ChIJ_U_NR69ZwokRkOaA92AjJ4U | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| kinship-coffee-astoria-21st-st | 23-92 21st St, Astoria, NY 11105 | ChIJbweDLOlfwokRsOeebzMx9r8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| kona-coffee-east-village | 57 2nd Ave, New York, NY 10003 | ChIJ3XEat4RZwokRXM4XlDVAX2Y | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| kona-coffee-grand-central | 100 Park Ave, New York, NY 10017 | ChIJC6crp1hZwokRcRqb7OLP5NY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| kos-kaffe-park-slope | 251 5th Ave, Brooklyn, NY 11215 | ChIJcf0dFQBbwokR8K8uiV_A78Q | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| lazy-suzy-bushwick | 703 Hart St, Brooklyn, NY 11221 | ChIJ8zp4KiBdwokR2MttOYBbgig | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| lincoln-station-prospect-heights | 409 Lincoln Pl, Brooklyn, NY 11238 | ChIJd7NPhApbwokRMsK48DkIVNQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| lions-milk-williamsburg | 104 Roebling St, Brooklyn, NY 11211 | ChIJRdQmkF5ZwokRFhQp8SEm1pA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| ludlow-hotel-lower-east-side | 180 Ludlow St, New York, NY | ChIJ7S1lLCJZwokRxB5ZKWzGmqg | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| madame-bonte-yorkville | 1834 2nd Ave, New York, NY 10128 | ChIJlwjJzyZZwokRG7ZHbpbpy34 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| manhattanville-coffee-harlem-collective | 1850 Amsterdam Ave, New York, NY 10031 | ChIJGyT75Bj3wokRpQiEYoShOI0 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| marlton-hotel-greenwich-village | 5 W 8th St, New York, NY 10011 | ChIJuac4MpdZwokRPSTvSd3DmME | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| moxy-brooklyn-williamsburg | 353 Bedford Ave, Brooklyn, NY 11211 | ChIJMUSTc99bwokRYdhLTL_58pU | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| moxy-nyc-downtown-recreation | 26 Ann St, 3rd Floor, New York, NY | ChIJuShHLQRbwokRcNUNxb5Yp54 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| muhlenberg-library | 209 W 23rd St, New York, NY | ChIJp3O8ILtZwokRbgO_BXZqGNI | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| mulberry-street-library | 10 Jersey St, New York, NY 10012 | ChIJ1UovZY9ZwokRGCaEaGe4d8M | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| mushtari-cafe-harlem | 31 W 125th St, New York, NY 10027 | ChIJj8lvgZz3wokR3lIrFvNZ3DY | 1.00 | ✓ | ✗ | auto: high name similarity + borough match |
| nook-bushwick | 45 Irving Ave, Unit 1, Brooklyn, NY 11237 | ChIJ9X57zTpdwokRPdjuSuDrv1Y | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| now-or-never-coffee-soho | 30 Grand St, New York, NY 10013 | ChIJcQM_C4FZwokR0xEGxV7HeVM | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| nypl-53rd-street-library | 18 W 53rd St, New York, NY 10019 | ChIJdXLqYvlYwokRIS_17aA1Q2w | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| nypl-battery-park-city | 175 North End Ave, New York, NY 10282 | ChIJgVO4hhxawokRnssO35tIowk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| nypl-library-for-the-performing-arts | 40 Lincoln Center Plaza, New York, NY 10023 | ChIJkx9xgPVYwokRZjZfQE7-UJc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| nypl-schwarzman-rose-main-reading-room | 476 Fifth Ave, New York, NY 10018 | — | 0.00 | ✓ | ✗ | unresolved: best candidate too weak (sim 0.00, borough true, street false) |
| nypl-washington-heights | 1000 St. Nicholas Ave, New York, NY 10032 | ChIJi4qCsIP2wokR4Bi1ODx2U2w | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| oculus-world-trade-center | 185 Greenwich St, New York, NY 10007 | ChIJ4f4VwT5bwokRwQ6hjfC-eTM | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| odd-fox-coffee-greenpoint | 984 Manhattan Ave, Brooklyn, NY 11222 | ChIJkb2_OT9ZwokRoItMDiUMAOY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| ole-and-steen-union-square | 873 Broadway, New York, NY 10003 | ChIJ90wjGmVZwokRYgHdTWaGmTA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| overflow-coffee-long-island-city | 46-36 Vernon Blvd, Long Island City, NY 11101 | ChIJkUd-KWFZwokRt_NBYp_Erck | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| pacific-library | 25 Fourth Ave, Brooklyn, NY 11217 | ChIJZ8wJyK1bwokRI9c4rhWIzOc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| paper-coffee-nomad | 44 W 29th St, New York, NY 10001 | ChIJA5V7V69ZwokRNI_y14Yvu-w | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| park-avenue-plaza-atrium | 55 E 52nd St, New York, NY 10055 | ChIJSXd0e_tYwokRLnhvg2Q329o | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| partners-coffee-long-island-city | 26-25 Jackson Ave, Long Island City, NY 11101 | ChIJQ0MAdylZwokRTl8FGknAU3s | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| picky-barista-columbus-ave | 667 Columbus Ave, New York, NY 10025 | ChIJNaiZHlBZwokRg8lJdrW099w | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| postmark-cafe-park-slope | 326 6th St, Brooklyn, NY 11215 | ChIJq47_2f1awokRJaZOW5MQQ6s | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| public-hotel-lower-east-side | 215 Chrystie St, New York, NY 10002 | ChIJYY-OM4RZwokRvA7ECx3HRZw | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| qahwah-house-astoria | 22-37 31st St, Astoria, NY | ChIJ1f8aVABfwokRf_xKf0uyGi8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| qahwah-house-morningside-heights | 2869 Broadway, New York, NY 10025 | ChIJPd7mVQD3wokR2DTiYnniFhs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| rhythm-zero-greenpoint | 32 Kent St, Brooklyn, NY | ChIJ_R0w0SRZwokRCUZlNLG9B-A | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| santander-work-cafe-williamsburg | 85 N 6th St, Brooklyn, NY 11249 | ChIJmbMMAN1ZwokRBI9nRONDyKQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| sey-coffee-bushwick | 18 Grattan St, Brooklyn, NY 11206 | ChIJtz83BQFcwokRrUZ9HpeGOng | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| sit-and-wonder-prospect-heights | 688 Washington Ave, Brooklyn, NY 11238 | ChIJdTjwaaFbwokRn7WZXdx_fR8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| stavros-niarchos-foundation-library | 455 Fifth Ave, New York, NY 10016 | ChIJuw6oHVZZwokRzYyh9VP9irE | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| stone-street-coffee-soho | 379 Broome St, New York, NY 10013 | ChIJTXOfvSlZwokRN_ZPNFLRDdY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| stonefruit-espresso-bed-stuy | 1058 Bedford Ave, Brooklyn, NY 11205 | ChIJz03QXJRbwokR7eKaWjPrxs8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| sunset-park-library | 5108 4th Ave, Brooklyn, NY 11220 | ChIJe8dAWbFawokRG3XCO9k8UoY | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| sweetleaf-greenpoint | 159 Freeman St, Brooklyn, NY 11222 | ChIJ11Kj6D5ZwokR1_xM1x2XwVs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| sweetleaf-long-island-city | 10-93 Jackson Ave, Long Island City, NY 11101 | ChIJc50m9iRZwokReFDd1LOMp8U | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-bean-east-village-2nd-ave | 54 2nd Ave, New York, NY 10003 | ChIJv5LcpIRZwokRJdoHntqgF6I | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-beekman-fidi | 123 Nassau St, New York, NY 10038 | ChIJq6r-exhawokRKgBzzPkn57U | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-chipped-cup-hamilton-heights | 3610 Broadway, New York, NY 10031 | ChIJBWDRs4pYwokRTZSRfygDjhc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-granddaddy-chinatown | 290 Grand St, New York, NY 10002 | ChIJq6pmnodZwokR7pdSBm1tofE | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-hoxton-williamsburg | 97 Wythe Ave, Brooklyn, NY 11249 | ChIJuSLgZ11ZwokRdHegOodYXOs | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| the-lost-draft-nolita | 398 Broome Street, New York, NY 10013 | ChIJHcFFXH9ZwokR_QKedPacLiQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| think-coffee-greenwich-village | 248 Mercer St, New York, NY 10012 | ChIJ1atSGIVZwokRmyJxm9r4OdQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| think-coffee-tribeca | 350 Broadway, New York, NY 10013 | ChIJaR0w9iBawokRGwkdqcC9EPk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| urban-garden-room-one-bryant-park | 1 Bryant Park (Sixth Ave at W 43rd St), New York, NY 10036 | ChIJm4iTeABZwokRrdGenI0Tsjk | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| variety-coffee-chelsea | 261 7th Ave, New York, NY 10001 | ChIJ49KnM6VZwokRArJkBByO0Dc | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| variety-coffee-greenpoint | 142 Driggs Avenue, Brooklyn, NY 11222 | ChIJu921LlFZwokRCx8U6m3DobQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| variety-coffee-park-slope | 312 7th Ave, Brooklyn, NY 11215 | ChIJaxo7yZlbwokRUzF4zSxnGbg | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| variety-coffee-upper-east-side | 1269 Lexington Ave, New York, NY 10028 | ChIJPdvZ77xYwokRCdSJZL-hWm8 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| verse-cafe-astoria | 28-13 Astoria Blvd, Astoria, NY 11102 | ChIJD-V4AgBfwokRA9fa8LYFabI | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| whole-foods-tribeca | 270 Greenwich St, New York, NY 10007 | ChIJl4BZ5opZwokRUR0n7MrTIEA | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| whole-foods-union-square | 4 Union Sq S, New York, NY 10003 | ChIJlZFg95hZwokRzTo2UWdo0Lg | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| williamsburgh-library | 240 Division Ave, Brooklyn, NY 11211 | ChIJE8BdM-dbwokRBWgQmj9_dMQ | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
| winter-garden-brookfield-place | 230 Vesey St, New York, NY 10281 | ChIJN1Nbse9bwokRfAzu0hhcoE4 | 1.00 | ✓ | ✓ | auto: high name similarity + borough match |
