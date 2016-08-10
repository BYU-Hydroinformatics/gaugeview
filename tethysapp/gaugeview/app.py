from tethys_sdk.base import TethysAppBase, url_map_maker


class GaugeviewerWml(TethysAppBase):
    """
    Tethys app class for Gaugeviewer WML.
    """
    name = 'USGS and AHPS Gaugeviewer WML'
    index = 'gaugeview:home'
    icon = 'gaugeview/images/icon.gif'
    package = 'gaugeview'
    root_url = 'gaugeview'
    color = '#e67e22'
    description = 'Allows for viewing USGS and AHPS gauges, downloading data as a WaterML file, uploading data ' \
                  'to HydroShare as a Referenced Time Series, launching data in the CUAHSI Time Series Viewer app, ' \
                  'and comparing to NWM forecasts.'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='gaugeview',
                           controller='gaugeview.controllers.home'),
                    UrlMap(name='ahps',
                           url='gaugeview/ahps',
                           controller='gaugeview.controllers.ahps'),
                    UrlMap(name='usgs',
                           url='gaugeview/usgs',
                           controller='gaugeview.controllers.usgs'),
                    UrlMap(name='waterml',
                           url='gaugeview/waterml',
                           controller='gaugeview.controllers.get_water_ml'),
                    UrlMap(name='upload_to_hydroshare',
                           url='gaugeview/upload-to-hydroshare',
                           controller='gaugeview.controllers.upload_to_hydroshare'),
                    )

        return url_maps
