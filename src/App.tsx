import { useEffect, useState } from "react";
// import * as S from "./WriteMap.styled";

declare const window: typeof globalThis & { 
  kakao: any;
};


export default function WriteMapPage(props: any) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//dapi.kakao.com/v2/maps/sdk.js?appkey=f487080ea91748abbd2e3df735d5af4c&libraries=services&autoload=false";
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(function () {
        let markers: any[] = [];

        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(38.2313466, 128.2139293),
          level: 5,
        };
        const map = new window.kakao.maps.Map(container, options);

        const markerPosition = new window.kakao.maps.LatLng(
          38.2313466,
          128.2139293
        );

        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        marker.setMap(map);

        const ps = new window.kakao.maps.services.Places();

        const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });

        const searchForm = document.getElementById("submit_btn");
        searchForm?.addEventListener("click", function (e) {
          e.preventDefault();
          searchPlaces();
        });

        function searchPlaces() {
          const keyword = (
            document.getElementById("keyword") as HTMLInputElement
          ).value;

          if (!keyword.replace(/^\s+|\s+$/g, "")) {
            alert("키워드를 입력해주세요!");
            return false;
          }

          ps.keywordSearch(keyword, placesSearchCB);
        }

        function placesSearchCB(data: any, status: any, pagination: any) {
          if (status === window.kakao.maps.services.Status.OK) {
            displayPlaces(data);

            displayPagination(pagination);

            const bounds = new window.kakao.maps.LatLngBounds();
            for (let i = 0; i < data.length; i++) {
              displayMarker(data[i]);
              bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x));
              // console.log('data >>> ', data[i].y, data[i].x);
            }

            map.setBounds(bounds);
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            alert("검색 결과가 존재하지 않습니다.");
            return;
          } else if (status === window.kakao.maps.services.Status.ERROR) {
            alert("검색 결과 중 오류가 발생했습니다.");
            return;
          }
        }

        function displayMarker(place: any) {
          const marker = new window.kakao.maps.Marker({
            map,
            position: new window.kakao.maps.LatLng(place.y, place.x),
          });
          window.kakao.maps.event.addListener(
            marker,
            "click",
            function (mouseEvent: any) {
              props.setAddress(place);
              infowindow.setContent(`
              <span>
              ${place.place_name}
              </span>
              `);
              infowindow.open(map, marker);
              const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
              map.panTo(moveLatLon);
            }
          );
        }


        function displayPlaces(places: any) {
          let listEl = document.getElementById("placesList"),
          menuEl: any = document.getElementById("menu_wrap"),
          fragment = document.createDocumentFragment();
          const bounds = new window.kakao.maps.LatLngBounds();
          removeAllChildNods(listEl);
          removeMarker();
          for (let i = 0; i < places.length; i++) {
            const placePosition = new window.kakao.maps.LatLng(
              places[i].y,
              places[i].x
            );
            const marker = addMarker(placePosition, i);
            const itemEl = getListItem(i, places[i]);
            // bounds.extend(placePosition);
            (function (marker, title) {
              window.kakao.maps.event.addListener(
                marker,
                "mouseover",
                function () {
                  displayInfowindow(marker, title);
                }
              );

              window.kakao.maps.event.addListener(
                marker,
                "mouseout",
                function () {
                  infowindow.close();
                }
              );

              itemEl.addEventListener("click", function (e) {
                displayInfowindow(marker, title);
                props.setAddress(places[i]);
                map.panTo(placePosition);
              });
            })(marker, places[i].place_name);

            fragment.appendChild(itemEl);
          }

          listEl?.appendChild(fragment);
          menuEl.scrollTop = 0;

          map.panTo(bounds);
        }

        function getListItem(index: any, places: any) {
          const el = document.createElement("li");

          let itemStr =`
          <div class="info">
            <span class="marker marker_${index+1}">
              ${index+1}
            </span>
            <a href="${places.place_url}">
              <h5 class="info-item place-name">${places.place_name}</h5>
              ${
                places.road_address_name 
                ? `<span class="info-item road-address-name">
                    ${places.road_address_name}
                   </span>
                   <span class="info-item address-name">
                 	 ${places.address_name}
               	   </span>`
                : `<span class="info-item address-name">
             	     ${places.address_name}
                  </span>`
              }
              <span class="info-item tel">
                ${places.phone}
              </span>
            </a>
          </div>
          `

          el.innerHTML = itemStr;
          el.className = "item";

          return el;
        }

        // 마커를 생성하고 지도 위에 마커를 표시하는 함수
        function addMarker(position: any, idx: number) {
          const imageSrc =
            "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png";
          const imageSize = new window.kakao.maps.Size(36, 37);
          const imgOptions = {
            spriteSize: new window.kakao.maps.Size(36, 691),
            spriteOrigin: new window.kakao.maps.Point(0, idx * 46 + 10),
            offset: new window.kakao.maps.Point(13, 37),
          };

          const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions);

          const marker = new window.kakao.maps.Marker({
            position: position,
            image: markerImage,
          });

          marker.setMap(map);
          markers.push(marker);

          return marker;
        }

        function removeMarker() {
          for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
          }
          markers = [];
        }

        function displayPagination(pagination: any) {
          const paginationEl: any = document.getElementById("pagination");
          const fragment = document.createDocumentFragment();
          while (paginationEl?.hasChildNodes()) {
            paginationEl.removeChild(paginationEl.lastChild);
          }

          for (let i = 1; i <= pagination.last; i++) {
            const el = document.createElement("a");
            el.href = "#";
            el.innerHTML = String(i);

            if (i === pagination.current) {
              el.className = "on";
            } else {
              el.onclick = (function (i) {
                return function () {
                  pagination.gotoPage(i);
                };
              })(i);
            }

            fragment.appendChild(el);
          }
          paginationEl?.appendChild(fragment);
        }

        function displayInfowindow(marker: any, title: string) {
          const content =
            '<div style="padding:5px;z-index:1;">' + title + "</div>";

          infowindow.setContent(content);
          infowindow.open(map, marker);
        }

        function removeAllChildNods(el: any) {
          while (el.hasChildNodes()) {
            el.removeChild(el.lastChild);
          }
        }
      });
    };
  }, []);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const onchangeSearch = (event: any) => {
    setSearch(event?.target.value);
  };

  const onClickSearchBarOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="App">
      <div id="map" style={{ width: "1000vw", height: "100vh" }} />
    </div>
  );
}