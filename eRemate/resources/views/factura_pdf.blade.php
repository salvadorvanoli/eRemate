<!DOCTYPE html>
<html lang="en">

<head>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'PT Sans', sans-serif;
        }

        @page {
            size: 2.8in 11in;
            margin-top: 0cm;
            margin-left: 0cm;
            margin-right: 0cm;
        }

        table {
            width: 100%;
        }

        tr {
            width: 100%;

        }

        h1 {
            text-align: center;
            vertical-align: middle;
        }

        #logo {
            width: 60%;
            text-align: center;
            -webkit-align-content: center;
            align-content: center;
            padding: 5px;
            margin: 2px;
            display: block;
            margin: 0 auto;
        }

        header {
            width: 100%;
            text-align: center;
            -webkit-align-content: center;
            align-content: center;
            vertical-align: middle;
        }

        .items thead {
            text-align: center;
        }

        .center-align {
            text-align: center;
        }

        .bill-details td {
            font-size: 12px;
        }

        .receipt {
            font-size: medium;
        }

        .items .heading {
            font-size: 12.5px;
            text-transform: uppercase;
            border-top:1px solid black;
            margin-bottom: 4px;
            border-bottom: 1px solid black;
            vertical-align: middle;
        }

        .items thead tr th:first-child,
        .items tbody tr td:first-child {
            width: 47%;
            min-width: 47%;
            max-width: 47%;
            word-break: break-all;
            text-align: left;
        }

        .items td {
            font-size: 12px;
            text-align: right;
            vertical-align: bottom;
        }

        .items td.center-align {
            text-align: center !important;
        }

        .sum-up {
            text-align: right !important;
        }
        .total {
            font-size: 13px;
            border-top:1px dashed black !important;
            border-bottom:1px dashed black !important;
        }
        .total.text, .total.price {
            text-align: right;
        }
        .line {
            border-top:1px solid black !important;
        }
        .heading.rate {
            width: 20%;
        }
        .heading.amount {
            width: 25%;
        }
        .heading.qty {
            width: 5%
        }
        p {
            padding: 1px;
            margin: 0;
        }
        section, footer {
            font-size: 12px;
        }
    </style>
    <style>
        .center-align {
            text-align: center;
        }
    </style>
</head>

<body>
    <header>
        <div id="logo" class="media" data-src="logo.png" src="./logo.png"></div>
    </header>
    <p>Número : {{ $factura->id ?? '' }}</p>
    <table class="bill-details">
        <tbody>
            <tr>
                <td>Fecha : <span>{{ \Carbon\Carbon::now()->format('d/m/Y') }}</span></td>
                <td>Hora : <span>{{ \Carbon\Carbon::now()->format('H:i') }}</span></td>
            </tr>
            <tr>
                <th class="center-align" colspan="2"><span class="receipt">Factura Original</span></th>
            </tr>
        </tbody>
    </table>
    
    <table class="items">
        <thead>
            <tr>
                <th class="heading name">Item</th>
                <th class="heading amount">Cantidad</th>
            </tr>
        </thead>
        <tbody>
        @foreach($factura->compra?->lote?->articulos ?? [] as $articulo)
            <tr>
                <td>
                    @if(is_array($articulo->imagenes))
                        {{ $articulo->imagenes[0] ?? '' }}
                    @else
                        {{ $articulo->imagenes ?? '' }}
                    @endif
                </td>
                <td class="center-align">1</td>
            </tr>
        @endforeach
        <tr>
            <td colspan="1" class="sum-up line">Subtotal</td>
            <td class="line price">{{ number_format($factura->monto ?? 0, 2, '.', '') }}</td>
        </tr>
        <tr>
            <td colspan="1" class="sum-up">Costo adicional</td>
            <td class="price">0.00</td>
        </tr>
        <tr>
            <th class="total text">Total</th>
            <th class="total price">{{ number_format($factura->monto ?? '', 2, '.', '') }}</th>
        </tr>
        </tbody>
    </table>
    <section>
        <p>
            Método de pago : <span>{{ $factura->metodoPago ?? '' }}</span>
        </p>
        
    </section>
    
</body>

</html>