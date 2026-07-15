// 탭 전환 로직
$(document).ready(function () {
    $('.tab.mt30 > li').on('click', function (e) {
        e.preventDefault();

        var target = $(this).data('tab');

        $('.tab.mt30 > li').removeClass('active');
        $(this).addClass('active');

        $('.tab-panel').hide();
        $('.tab-panel[data-panel="' + target + '"]').show();

        if (target === 'buildStatus' && $('#includeBuildStatus').is(':empty')) {
            $.ajax({
                url: '/wordStatus/getBuildStatusList.do',
                type: 'post',
                dataType: 'html',
                beforeSend: function () {
                    spin.start();
                },
                success: function (data) {
                    $('#includeBuildStatus').html(data);
                },
                error: function () {
                    alert('오류가 발생하였습니다.');
                },
                complete: function () {
                    spin.stop();
                }
            });
        }
    });
});


// 구축-온용어 차이값 계산 및 색상 클래스 적용
function fnCalcDiffValue() {
    $('.table_wrap tbody tr').each(function () {
        var $row = $(this);
        var $cells = $row.find('td.col-data');

        function toNum($cell) {
            return parseFloat($cell.text().trim().replace(/,/g, '')) || 0;
        }

        // 구축
        var buildTotal = toNum($cells.eq(0));
        var buildExpose = toNum($cells.eq(1));
        var buildNonExpose = toNum($cells.eq(2));

        // 온용어
        var onTotal = toNum($cells.eq(3));
        var onExpose = toNum($cells.eq(4));
        var onNonExpose = toNum($cells.eq(5));

        var diffTotal = buildTotal - onTotal;
        var diffExpose = buildExpose - onExpose;
        var diffNonExpose = buildNonExpose - onNonExpose;

        // 차이
        var $diffTotalCell = $cells.eq(6)
        var $diffExposeCell = $cells.eq(7);
        var $diffNonExposeCell = $cells.eq(8);

        fnSetDiffCell($diffTotalCell, diffTotal);
        fnSetDiffCell($diffExposeCell, diffExpose);
        fnSetDiffCell($diffNonExposeCell, diffNonExpose);
    });
}

// 차이값 색상 세팅
function fnSetDiffCell($cell, value) {
    $cell.text(value.toLocaleString());
    $cell.removeClass('text-minus text-plus');

    if (value < 0) {
        $cell.addClass('red');
    } else if (value > 0) {
        $cell.addClass('green');
    }
}

$(document).ready(function () {
    fnCalcDiffValue();
});